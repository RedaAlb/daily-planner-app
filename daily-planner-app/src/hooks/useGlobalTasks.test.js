import { renderHook, act } from '@testing-library/react';
import useGlobalTasks from './useGlobalTasks';

// Mock firebase database functions
vi.mock('firebase/database', () => {
  return {
    ref: vi.fn(),
    onValue: (ref, callback) => {
      // Simulate calling the onValue callback with empty data initially
      callback({ val: () => null });
      // Return a mock unsubscribe function
      return () => {};
    },
    off: vi.fn(),
    update: vi.fn().mockResolvedValue(),
    set: vi.fn().mockResolvedValue(),
    remove: vi.fn().mockResolvedValue()
  };
});

// Mock the Firebase appDb constant
vi.mock('../utils/Firebase', () => ({
  appDb: {}
}));

describe('useGlobalTasks hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
