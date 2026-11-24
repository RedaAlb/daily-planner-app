import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import SettingsView from './SettingsView';
import { checkForAppUpdate, getVersionSummary } from '../../utils/appVersion';

vi.mock('./SettingsTopBar', () => ({
  __esModule: true,
  default: () => <div data-testid="settings-topbar" />
}));

vi.mock('../../utils/Firebase', () => ({
  exportDb: vi.fn(),
  importDb: vi.fn(),
  deleteDb: vi.fn().mockResolvedValue(true)
}));

vi.mock('../../utils/appVersion', () => ({
  getVersionSummary: vi.fn(() => 'main@b39dd53 · 24 Nov 2026, 13:55'),
  checkForAppUpdate: vi.fn()
}));

describe('SettingsView About section', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays the deployed version with branch name and commit SHA', () => {
    render(<SettingsView />);

    expect(screen.getByText('About')).toBeInTheDocument();
    expect(screen.getByText('Version')).toBeInTheDocument();
    expect(screen.getByText('main@b39dd53 · 24 Nov 2026, 13:55')).toBeInTheDocument();
    expect(getVersionSummary).toHaveBeenCalled();
  });

  it('shows up-to-date message when Check for update finds no newer version', async () => {
    checkForAppUpdate.mockResolvedValueOnce('up-to-date');

    render(<SettingsView />);
    fireEvent.click(screen.getByText('Check for update'));

    await waitFor(() => {
      expect(screen.getByText("You're on the latest version")).toBeInTheDocument();
    });
  });

  it('shows reloading message when Check for update finds a new version', async () => {
    checkForAppUpdate.mockResolvedValueOnce('updated');

    render(<SettingsView />);
    fireEvent.click(screen.getByText('Check for update'));

    await waitFor(() => {
      expect(screen.getByText('Update found! Reloading...')).toBeInTheDocument();
    });
  });
});
