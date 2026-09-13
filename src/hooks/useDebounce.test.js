import { renderHook, act } from '@testing-library/react';
import useDebounce from './useDebounce';

vi.useFakeTimers();

const setVisibility = (state) => {
  Object.defineProperty(document, 'visibilityState', { value: state, configurable: true });
  document.dispatchEvent(new Event('visibilitychange'));
};

describe('useDebounce', () => {
  afterEach(() => {
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
  });

  it('should debounce the callback', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebounce(callback, 300));

    act(() => {
      result.current('test1');
      result.current('test2');
      result.current('test3');
    });

    expect(callback).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('test3');
  });

  it('flushes a pending call immediately on pagehide', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebounce(callback, 300));

    act(() => {
      result.current('unsaved');
    });
    expect(callback).not.toHaveBeenCalled();

    act(() => {
      window.dispatchEvent(new Event('pagehide'));
    });

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('unsaved');

    // The original timer must not fire a second time afterwards
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('flushes a pending call when the page becomes hidden', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebounce(callback, 300));

    act(() => {
      result.current('backgrounded');
    });

    act(() => {
      setVisibility('hidden');
    });

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('backgrounded');
  });

  it('does not fire when the page becomes visible or when nothing is pending', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebounce(callback, 300));

    act(() => {
      window.dispatchEvent(new Event('pagehide'));
      setVisibility('hidden');
    });
    expect(callback).not.toHaveBeenCalled();

    act(() => {
      result.current('pending');
      setVisibility('visible');
    });
    expect(callback).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('uses the latest callback when flushing', () => {
    const first = vi.fn();
    const second = vi.fn();
    const { result, rerender } = renderHook(({ cb }) => useDebounce(cb, 300), {
      initialProps: { cb: first }
    });

    act(() => {
      result.current('value');
    });
    rerender({ cb: second });

    act(() => {
      window.dispatchEvent(new Event('pagehide'));
    });

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith('value');
  });

  it('cancels the pending call on unmount and removes its listeners', () => {
    const callback = vi.fn();
    const { result, unmount } = renderHook(() => useDebounce(callback, 300));

    act(() => {
      result.current('dropped');
    });
    unmount();

    act(() => {
      vi.advanceTimersByTime(300);
      window.dispatchEvent(new Event('pagehide'));
    });

    expect(callback).not.toHaveBeenCalled();
  });
});
