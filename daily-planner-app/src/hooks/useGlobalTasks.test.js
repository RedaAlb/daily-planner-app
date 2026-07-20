import { renderHook, act } from '@testing-library/react';
import useGlobalTasks from './useGlobalTasks';

// Mock firebase database functions
jest.mock('firebase/database', () => {
  return {
    ref: jest.fn(),
    onValue: (ref, callback) => {
      // Simulate calling the onValue callback with empty data initially
      callback({ val: () => null });
      // Return a mock unsubscribe function
      return () => {};
    },
    off: jest.fn(),
    update: jest.fn().mockResolvedValue(),
    set: jest.fn().mockResolvedValue(),
    remove: jest.fn().mockResolvedValue()
  };
});

// Mock the Firebase appDb constant
jest.mock('../utils/Firebase', () => ({
  appDb: {}
}));

describe('useGlobalTasks hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with empty items and archivedItems arrays', () => {
    const { result } = renderHook(() => useGlobalTasks());
    
    expect(result.current.items).toEqual([]);
    expect(result.current.archivedItems).toEqual([]);
  });

  it('exposes the correct functions', () => {
    const { result } = renderHook(() => useGlobalTasks());
    
    expect(typeof result.current.onAddTask).toBe('function');
    expect(typeof result.current.toggleCheckbox).toBe('function');
    expect(typeof result.current.handleTextChange).toBe('function');
    expect(typeof result.current.archiveItem).toBe('function');
    expect(typeof result.current.confirmDelete).toBe('function');
    expect(typeof result.current.unarchiveItem).toBe('function');
    expect(typeof result.current.deleteArchivedItem).toBe('function');
  });
});
