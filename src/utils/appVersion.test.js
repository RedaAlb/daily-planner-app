import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getVersionSummary, formatBuildTime, checkForAppUpdate } from './appVersion';

describe('appVersion utilities', () => {
  const originalServiceWorker = navigator.serviceWorker;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'serviceWorker', {
      value: originalServiceWorker,
      configurable: true,
      writable: true
    });
    vi.useRealTimers();
  });

  it('formats version summary with branch, commit SHA, and build time', () => {
    const summary = getVersionSummary({
      branch: 'main',
      commitSha: 'b39dd53',
      buildTime: '2026-11-24T13:55:00.000Z'
    });
    expect(summary).toContain('main@b39dd53');
    expect(summary).toContain('·');
    expect(summary).toContain('2026');
  });

  it('omits separator when build time is empty or invalid', () => {
    expect(getVersionSummary({ branch: 'main', commitSha: 'abc1234', buildTime: '' })).toBe('main@abc1234');
    expect(formatBuildTime('not-a-date')).toBe('');
  });

  it('returns unsupported when no service worker registration is active', async () => {
    Object.defineProperty(navigator, 'serviceWorker', {
      value: { getRegistration: vi.fn().mockResolvedValue(undefined) },
      configurable: true
    });

    const result = await checkForAppUpdate();
    expect(result).toBe('unsupported');
  });

  it('returns up-to-date when registration.update() finds no new worker', async () => {
    const registration = {
      update: vi.fn().mockResolvedValue(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      waiting: null,
      installing: null
    };
    Object.defineProperty(navigator, 'serviceWorker', {
      value: { getRegistration: vi.fn().mockResolvedValue(registration) },
      configurable: true
    });

    const result = await checkForAppUpdate();
    expect(registration.update).toHaveBeenCalledTimes(1);
    expect(result).toBe('up-to-date');
  });

  it('returns updated, signals SKIP_WAITING, and reloads when a waiting worker is found', async () => {
    vi.useFakeTimers();
    const reload = vi.fn();
    const postMessage = vi.fn();
    let controllerChangeCb;

    const registration = {
      update: vi.fn().mockResolvedValue(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      waiting: { postMessage },
      installing: null
    };

    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        getRegistration: vi.fn().mockResolvedValue(registration),
        addEventListener: vi.fn((evt, cb) => {
          if (evt === 'controllerchange') controllerChangeCb = cb;
        }),
        removeEventListener: vi.fn()
      },
      configurable: true
    });

    const promise = checkForAppUpdate({ reload, reloadDelayMs: 500 });
    await vi.waitFor(() => expect(controllerChangeCb).toBeDefined());
    controllerChangeCb();

    const result = await promise;
    expect(result).toBe('updated');
    expect(postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });

    vi.advanceTimersByTime(500);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('returns error if update check rejects', async () => {
    Object.defineProperty(navigator, 'serviceWorker', {
      value: { getRegistration: vi.fn().mockRejectedValue(new Error('offline')) },
      configurable: true
    });

    const result = await checkForAppUpdate();
    expect(result).toBe('error');
  });
});
