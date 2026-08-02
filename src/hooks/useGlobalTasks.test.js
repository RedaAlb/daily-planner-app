import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import useGlobalTasks from './useGlobalTasks';
import * as firebaseDatabase from 'firebase/database';

// Mock firebase database functions
vi.mock('firebase/database', () => {
  return {
    ref: vi.fn(),
    onValue: vi.fn((ref, callback, errorCallback) => {
      callback({ val: () => null });
      return () => {};
    }),
    off: vi.fn(),
    update: vi.fn().mockResolvedValue(),
    set: vi.fn().mockResolvedValue(),
    remove: vi.fn().mockResolvedValue(),
    push: vi.fn(() => ({ key: 'mock-uuid-123' }))
  };
});

// Mock the Firebase appDb constant
vi.mock('../utils/Firebase', () => ({
  appDb: {}
}));

describe('useGlobalTasks hook', () => {
  let onValueMock;

  beforeEach(() => {
    vi.clearAllMocks();
    onValueMock = firebaseDatabase.onValue;
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
    expect(typeof result.current.moveToTop).toBe('function');
    expect(typeof result.current.moveToBottom).toBe('function');
  });

  it('onAddTask pushes a new item to the top and updates orders', async () => {
    const { result } = renderHook(() => useGlobalTasks());
    
    act(() => {
      onValueMock.mock.calls[0][1]({
        val: () => ({
          'existing-1': { text: 'Task 1', order: 0 }
        })
      });
    });

    await act(async () => {
      await result.current.onAddTask();
    });

    expect(firebaseDatabase.push).toHaveBeenCalled();
    expect(firebaseDatabase.update).toHaveBeenCalled();
    const updateArg = firebaseDatabase.update.mock.calls[0][1];
    
    const keys = Object.keys(updateArg);
    expect(keys.length).toBe(2);
    expect(Object.values(updateArg).some(item => item.id === 'mock-uuid-123' && item.order === 0)).toBe(true);
    expect(Object.values(updateArg).some(item => item.id === 'existing-1' && item.order === 1)).toBe(true);
  });

  it('moveToBottom for checked items moves them to the top of checked items (below unchecked)', async () => {
    const { result } = renderHook(() => useGlobalTasks());
    
    act(() => {
      onValueMock.mock.calls[0][1]({
        val: () => ({
          'id-1': { text: 'Unchecked 1', checked: false, order: 0 },
          'id-2': { text: 'Checked 1', checked: true, order: 1 },
          'id-3': { text: 'Unchecked 2', checked: false, order: 2 },
          'id-4': { text: 'Unchecked 3', checked: false, order: 3 },
          'id-5': { text: 'Checked 2', checked: true, order: 4 },
          'id-6': { text: 'Checked 3', checked: true, order: 5 }
        })
      });
    });

    // Move 'Checked 1' (id-2) to bottom
    await act(async () => {
      await result.current.moveToBottom('id-2');
    });

    const updateArg = firebaseDatabase.update.mock.calls[0][1];
    const itemsUpdated = Object.values(updateArg);
    
    // Unchecked: id-1, id-3, id-4
    // Checked: id-2 (moved), id-5, id-6
    expect(itemsUpdated[0].id).toBe('id-1');
    expect(itemsUpdated[1].id).toBe('id-3');
    expect(itemsUpdated[2].id).toBe('id-4');
    expect(itemsUpdated[3].id).toBe('id-2');
    expect(itemsUpdated[4].id).toBe('id-5');
    expect(itemsUpdated[5].id).toBe('id-6');
  });

  it('moveToBottom for unchecked items moves them to the bottom of the unchecked items (above checked)', async () => {
    const { result } = renderHook(() => useGlobalTasks());
    
    act(() => {
      onValueMock.mock.calls[0][1]({
        val: () => ({
          'id-1': { text: 'Unchecked 1', checked: false, order: 0 },
          'id-2': { text: 'Unchecked 2', checked: false, order: 1 },
          'id-3': { text: 'Checked 1', checked: true, order: 2 }
        })
      });
    });

    // Move 'Unchecked 1' (id-1) to bottom
    await act(async () => {
      await result.current.moveToBottom('id-1');
    });

    const updateArg = firebaseDatabase.update.mock.calls[0][1];
    const itemsUpdated = Object.values(updateArg);
    
    // Result should be: id-2 (Unchecked 2), id-1 (Unchecked 1 moved), id-3 (Checked 1)
    expect(itemsUpdated[0].id).toBe('id-2');
    expect(itemsUpdated[1].id).toBe('id-1');
    expect(itemsUpdated[2].id).toBe('id-3');
  });

  it('unarchiveItem calculates correct order even with missing order props or empty list', async () => {
    const { result } = renderHook(() => useGlobalTasks());
    
    act(() => {
      onValueMock.mock.calls[0][1]({ val: () => null });
      onValueMock.mock.calls[1][1]({
        val: () => ({
          'archived-1': { text: 'Archived Task', archivedAt: 12345 }
        })
      });
    });

    await act(async () => {
      await result.current.unarchiveItem(0);
    });

    const updateArg = firebaseDatabase.update.mock.calls[0][1];
    const restoredItemKeys = Object.keys(updateArg).filter(k => k.includes('archived-1') && updateArg[k] !== null);
    expect(updateArg[restoredItemKeys[0]].order).toBe(0);
  });

  it('createGroup creates a new group in the database', async () => {
    const { result } = renderHook(() => useGlobalTasks());
    let newGroupId;
    await act(async () => {
      newGroupId = await result.current.createGroup('New Work Group');
    });
    
    expect(firebaseDatabase.push).toHaveBeenCalled();
    expect(firebaseDatabase.set).toHaveBeenCalled();
    expect(newGroupId).toBe('mock-uuid-123');
    
    const setArgs = firebaseDatabase.set.mock.calls[0];
    expect(setArgs[1].name).toBe('New Work Group');
    expect(setArgs[1].id).toBe('mock-uuid-123');
  });

  it('assignGroup updates the group of a task', async () => {
    const { result } = renderHook(() => useGlobalTasks());
    
    act(() => {
      onValueMock.mock.calls[0][1]({
        val: () => ({
          'task-1': { text: 'Task 1', order: 0, groupId: null }
        })
      });
    });

    await act(async () => {
      await result.current.assignGroup('task-1', 'group-uuid');
    });

    expect(firebaseDatabase.set).toHaveBeenCalled();
    const setArgs = firebaseDatabase.set.mock.calls[0];
    expect(setArgs[1].groupId).toBe('group-uuid');
    expect(setArgs[1].text).toBe('Task 1');
  });

});
