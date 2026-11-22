import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import useGlobalTasks from './useGlobalTasks';
import * as firebaseDatabase from 'firebase/database';
import { subscribeToAllGroupedTasks, updateTask as updateDailyTask, moveDailyTaskToGlobal, moveDailyTasksToGlobal } from '../utils/Firebase';

// Mock firebase database functions
vi.mock('firebase/database', () => {
  return {
    ref: vi.fn((db, path) => ({ path })),
    onValue: vi.fn(),
    update: vi.fn().mockResolvedValue(),
    set: vi.fn().mockResolvedValue(),
    remove: vi.fn().mockResolvedValue(),
    push: vi.fn(() => ({ key: 'mock-uuid-123' }))
  };
});

vi.mock('../utils/Firebase', () => ({
  appDb: {},
  updateTask: vi.fn().mockResolvedValue(),
  moveDailyTaskToGlobal: vi.fn().mockResolvedValue(),
  moveDailyTasksToGlobal: vi.fn().mockResolvedValue([]),
  subscribeToAllGroupedTasks: vi.fn(),
  GLOBAL_TASKS_PATH: 'global_tasks',
  GLOBAL_TASK_GROUPS_PATH: 'global_task_groups'
}));

describe('useGlobalTasks hook', () => {
  let onValueMock;
  let subscribeGroupedMock;

  beforeEach(() => {
    vi.clearAllMocks();
    onValueMock = firebaseDatabase.onValue;
    subscribeGroupedMock = subscribeToAllGroupedTasks;

    // Default mock behavior for onValue (global tasks and groups)
    onValueMock.mockImplementation((ref, callback) => {
      callback({ val: () => null });
      return () => {};
    });

    // Default mock behavior for subscribeToAllGroupedTasks
    subscribeGroupedMock.mockImplementation((callback) => {
      callback([]);
      return () => {};
    });
  });

  it('initializes with empty items array', () => {
    const { result } = renderHook(() => useGlobalTasks());
    expect(result.current.items).toEqual([]);
  });

  it('merges global tasks and grouped daily tasks correctly', () => {
    // Mock global tasks
    onValueMock.mockImplementation((refObj, callback) => {
      if (refObj.path === 'global_tasks') {
        callback({
          val: () => ({
            'g-1': { text: 'Global Task 1', order: 0, groupId: 'group-1' }
          })
        });
      } else {
        callback({ val: () => null });
      }
      return () => {};
    });

    // Mock daily grouped tasks
    subscribeGroupedMock.mockImplementation((callback) => {
      callback([
        {
          id: '5-8-2026:0',
          text: 'Daily Task 1',
          checked: false,
          groupId: 'group-1',
          order: 0,
          source: 'daily',
          dateKey: '5-8-2026',
          dateIndex: 0,
          checkIndex: 0
        }
      ]);
      return () => {};
    });

    const { result } = renderHook(() => useGlobalTasks());
    
    expect(result.current.items.length).toBe(2);
    expect(result.current.items.find(i => i.id === 'g-1').source).toBe('global');
    expect(result.current.items.find(i => i.id === '5-8-2026:0').source).toBe('daily');
  });

  it('routes toggleCheckbox to global_tasks for global tasks', async () => {
    onValueMock.mockImplementation((refObj, callback) => {
      if (refObj.path === 'global_tasks') {
        callback({
          val: () => ({ 'g-1': { text: 'Global Task', checked: false } })
        });
      } else {
        callback({ val: () => null });
      }
      return () => {};
    });

    const { result } = renderHook(() => useGlobalTasks());

    await act(async () => {
      await result.current.toggleCheckbox('g-1', true);
    });

    expect(firebaseDatabase.set).toHaveBeenCalled();
    const setArgs = firebaseDatabase.set.mock.calls[0];
    expect(setArgs[0].path).toBe('global_tasks/g-1');
    expect(setArgs[1].checked).toBe(true);
  });

  it('routes toggleCheckbox to updateDailyTask using partial update for daily-sourced tasks', async () => {
    subscribeGroupedMock.mockImplementation((callback) => {
      callback([{
        id: '5-8-2026:0',
        text: 'Daily Task',
        checked: false,
        groupId: 'group-1',
        source: 'daily',
        dateKey: '5-8-2026',
        dateIndex: 0,
        checkIndex: 0
      }]);
      return () => {};
    });

    const { result } = renderHook(() => useGlobalTasks());

    await act(async () => {
      await result.current.toggleCheckbox('5-8-2026:0', true);
    });

    expect(updateDailyTask).toHaveBeenCalledWith(
      expect.any(Date),
      0,
      { checkIndex: 1 }
    );
  });

  it('routes handleTextChange to updateDailyTask using partial update for daily-sourced tasks', async () => {
    subscribeGroupedMock.mockImplementation((callback) => {
      callback([{
        id: '5-8-2026:0',
        text: 'Daily Task',
        checked: false,
        groupId: 'group-1',
        source: 'daily',
        dateKey: '5-8-2026',
        dateIndex: 0,
        checkIndex: 0
      }]);
      return () => {};
    });

    const { result } = renderHook(() => useGlobalTasks());

    await act(async () => {
      await result.current.handleTextChange('5-8-2026:0', 'Updated Text');
    });

    expect(updateDailyTask).toHaveBeenCalledWith(
      expect.any(Date),
      0,
      { text: 'Updated Text' }
    );
  });

  it('routes assignGroup to updateDailyTask using partial update for daily-sourced tasks', async () => {
    subscribeGroupedMock.mockImplementation((callback) => {
      callback([{
        id: '5-8-2026:0',
        text: 'Daily Task',
        checked: false,
        groupId: 'group-1',
        source: 'daily',
        dateKey: '5-8-2026',
        dateIndex: 0,
        checkIndex: 0
      }]);
      return () => {};
    });

    const { result } = renderHook(() => useGlobalTasks());

    await act(async () => {
      await result.current.assignGroup('5-8-2026:0', 'group-2');
    });

    expect(updateDailyTask).toHaveBeenCalledWith(
      expect.any(Date),
      0,
      { groupId: 'group-2' }
    );
  });

  it('assignGroup with null groupId on a daily-sourced task calls moveDailyTaskToGlobal', async () => {
    subscribeGroupedMock.mockImplementation((callback) => {
      callback([{
        id: '5-8-2026:0',
        text: 'Daily Task',
        checked: false,
        groupId: 'group-1',
        source: 'daily',
        dateKey: '5-8-2026',
        dateIndex: 0,
        checkIndex: 0
      }]);
      return () => {};
    });

    const { result } = renderHook(() => useGlobalTasks());

    await act(async () => {
      await result.current.assignGroup('5-8-2026:0', null);
    });

    expect(moveDailyTaskToGlobal).toHaveBeenCalledWith(
      '5-8-2026',
      0,
      { text: 'Daily Task', checkIndex: 0, groupId: null }
    );
  });

  it('unassignDate calls moveDailyTaskToGlobal', async () => {
    subscribeGroupedMock.mockImplementation((callback) => {
      callback([{
        id: '5-8-2026:0',
        text: 'Daily Task',
        checked: false,
        groupId: 'group-1',
        source: 'daily',
        dateKey: '5-8-2026',
        dateIndex: 0,
        checkIndex: 0
      }]);
      return () => {};
    });

    const { result } = renderHook(() => useGlobalTasks());

    await act(async () => {
      await result.current.unassignDate('5-8-2026:0');
    });

    expect(moveDailyTaskToGlobal).toHaveBeenCalledWith(
      '5-8-2026',
      0,
      { text: 'Daily Task', checkIndex: 0, groupId: 'group-1' }
    );
  });

  it('deleteGroup batches multiple daily tasks from the same dateKey into one moveDailyTasksToGlobal call', async () => {
    subscribeGroupedMock.mockImplementation((callback) => {
      callback([
        {
          id: '5-8-2026:0',
          text: 'Task A',
          checked: false,
          groupId: 'group-1',
          source: 'daily',
          dateKey: '5-8-2026',
          dateIndex: 0,
          checkIndex: 0
        },
        {
          id: '5-8-2026:2',
          text: 'Task B',
          checked: true,
          groupId: 'group-1',
          source: 'daily',
          dateKey: '5-8-2026',
          dateIndex: 2,
          checkIndex: 1
        }
      ]);
      return () => {};
    });

    const { result } = renderHook(() => useGlobalTasks());

    await act(async () => {
      await result.current.deleteGroup('group-1');
    });

    expect(moveDailyTasksToGlobal).toHaveBeenCalledTimes(1);
    expect(moveDailyTasksToGlobal).toHaveBeenCalledWith('5-8-2026', [
      { dateIndex: 0, text: 'Task A', checkIndex: 0, groupId: null },
      { dateIndex: 2, text: 'Task B', checkIndex: 1, groupId: null }
    ]);
    expect(firebaseDatabase.remove).toHaveBeenCalledWith({ path: 'global_task_groups/group-1' });
  });
});
