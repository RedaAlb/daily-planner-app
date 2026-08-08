import { vi, describe, it, expect, beforeEach } from 'vitest';
import * as db from 'firebase/database';
import {
  assignGroupToDailyTask,
  moveDailyTaskToGlobal,
  moveGlobalTaskToDailyPlanner,
  createGlobalTaskGroup,
  ensureDateKeyExists,
  updateTask,
  parseDateKeys
} from './Firebase';

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({}))
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn()
}));

// Remove the self-mock of updateTask since we want to test the full flow

vi.mock('firebase/database', () => {
  return {
    getDatabase: vi.fn(() => ({})),
    ref: vi.fn((appDb, path) => ({ path })),
    child: vi.fn((parent, path) => ({ path: `${parent.path || ''}${path}` })),
    get: vi.fn().mockResolvedValue({
      exists: () => false,
      val: () => null
    }),
    set: vi.fn().mockResolvedValue(),
    update: vi.fn().mockResolvedValue(),
    remove: vi.fn().mockResolvedValue(),
    push: vi.fn(() => ({ key: 'mock-pushed-key-123' }))
  };
});

describe('Firebase integration helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('assignGroupToDailyTask updates task in place with groupId using partial update', async () => {
    const task = { text: 'My Daily Task', checkIndex: 0 };
    const date = new Date(2026, 7, 5); // 5 Aug 2026

    await assignGroupToDailyTask(date, 0, task, 'group-abc');
    
    expect(db.update).toHaveBeenCalled();
    const updateCall = db.update.mock.calls[0];
    expect(updateCall[0].path).toBe('5-8-2026/tasks/0/');
    expect(updateCall[1]).toEqual({
      groupId: 'group-abc'
    });
  });

  it('assignGroupToDailyTask with null groupId passes null to remove groupId from task', async () => {
    const task = { text: 'My Daily Task', checkIndex: 0, groupId: 'old-group' };
    const date = new Date(2026, 7, 5);

    await assignGroupToDailyTask(date, 0, task, null);
    
    expect(db.update).toHaveBeenCalled();
    const updateCall = db.update.mock.calls[0];
    expect(updateCall[0].path).toBe('5-8-2026/tasks/0/');
    expect(updateCall[1]).toEqual({
      groupId: null
    });
  });

  it('moveDailyTaskToGlobal moves a dated task to global_tasks and clears daily slot', async () => {
    db.get.mockImplementation(async () => ({
      exists: () => true,
      val: () => ({ tasks: [{ text: 'Original task', checkIndex: 0, groupId: 'group-1' }] })
    }));

    const task = { text: 'Original task', checkIndex: 0, groupId: 'group-1' };
    const newId = await moveDailyTaskToGlobal('5-8-2026', 0, task);
    
    expect(newId).toBe('mock-pushed-key-123');
    
    // Should create in global_tasks
    expect(db.set).toHaveBeenCalledTimes(2); // One for global_tasks, one for updateDateTasks
    const globalTasksSetCall = db.set.mock.calls[0];
    expect(globalTasksSetCall[0].path).toBe('global_tasks/mock-pushed-key-123');
    expect(globalTasksSetCall[1]).toEqual({
      id: 'mock-pushed-key-123',
      text: 'Original task',
      checked: false,
      order: 0,
      groupId: 'group-1',
      createdAt: expect.any(Number)
    });

    // Should clear daily slot
    const dailyPlannerSetCall = db.set.mock.calls[1];
    expect(dailyPlannerSetCall[0].path).toBe('5-8-2026/tasks/');
    expect(dailyPlannerSetCall[1][0]).toEqual({ checkIndex: 0, checked: false, text: "" });
  });

  it('createGlobalTaskGroup pushes a new group to global_task_groups in Firebase', async () => {
    const groupId = await createGlobalTaskGroup('Work Projects');
    expect(groupId).toBe('mock-pushed-key-123');
    expect(db.set).toHaveBeenCalled();

    const groupPayload = db.set.mock.calls[0][1];
    expect(groupPayload).toEqual({
      id: 'mock-pushed-key-123',
      name: 'Work Projects',
      order: 0,
      createdAt: expect.any(Number)
    });
  });

  it('ensureDateKeyExists adds dateKey under dateKeys/ if snapshot does not exist', async () => {
    db.get.mockResolvedValueOnce({
      exists: () => false,
      val: () => null
    });
    await ensureDateKeyExists('5-8-2026');
    expect(db.get).toHaveBeenCalled();
  });

  it('moveGlobalTaskToDailyPlanner writes to target date tasks FIRST before removing from global_tasks', async () => {
    // moveGlobalTaskToDailyPlanner calls ensureDateKeyExists (1 get) then loadDate (1 get).
    db.get.mockImplementation(async (refObj) => {
      if (refObj.path.includes('dateKeys')) {
        return { exists: () => true, val: () => true };
      }
      return {
        exists: () => true,
        val: () => ({ tasks: [{ checkIndex: 0, checked: false, text: "" }] })
      };
    });

    const globalTask = { id: 'global-task-999', text: 'Reviewed Task', checked: true, groupId: 'group-xyz' };
    const targetDate = new Date(2026, 7, 6); // 6th August 2026

    const callsOrder = [];
    db.set.mockImplementation(async () => {
      callsOrder.push('set');
    });
    db.remove.mockImplementation(async () => {
      callsOrder.push('remove');
    });

    const success = await moveGlobalTaskToDailyPlanner(globalTask, targetDate);

    expect(success).toBe(true);
    expect(db.set).toHaveBeenCalled();
    expect(db.remove).toHaveBeenCalled();

    // Verify order: 'set' (writing to daily planner) MUST happen BEFORE 'remove' (deleting from global_tasks)
    expect(callsOrder.indexOf('set')).toBeLessThan(callsOrder.indexOf('remove'));

    // Verify groupId was preserved
    const setCalls = db.set.mock.calls;
    const tasksSetCall = setCalls.find(call => call[0]?.path === '6-8-2026/tasks/');
    const writtenTasks = tasksSetCall ? tasksSetCall[1] : setCalls[0][1];
    expect(writtenTasks[0]).toEqual({ checkIndex: 1, checked: true, text: 'Reviewed Task', groupId: 'group-xyz' });
  });

  it('moveGlobalTaskToDailyPlanner with source daily clears task from source date instead of deleting from global_tasks', async () => {
    db.get.mockImplementation(async (refObj) => {
      if (refObj.path.includes('dateKeys')) {
        return { exists: () => true, val: () => true };
      }
      return {
        exists: () => true,
        val: () => ({ tasks: [{ checkIndex: 1, checked: true, text: "My task" }, { checkIndex: 0, checked: false, text: "" }] })
      };
    });

    const globalTask = { source: 'daily', dateKey: '1-8-2026', dateIndex: 0, text: 'My task', checked: true, groupId: 'group-xyz' };
    const targetDate = new Date(2026, 7, 6);

    const success = await moveGlobalTaskToDailyPlanner(globalTask, targetDate);

    expect(success).toBe(true);
    expect(db.remove).not.toHaveBeenCalled();
    
    const setCalls = db.set.mock.calls;
    
    const targetSetCall = setCalls.find(call => call[0]?.path === '6-8-2026/tasks/');
    expect(targetSetCall[1][1]).toEqual({ checkIndex: 1, checked: true, text: 'My task', groupId: 'group-xyz' });

    const sourceSetCall = setCalls.find(call => call[0]?.path === '1-8-2026/tasks/');
    expect(sourceSetCall[1][0]).toEqual({ checkIndex: 0, checked: false, text: "" });
  });

  it('parseDateKeys correctly extracts date keys from object keys, values, and arrays', () => {
    const arrayData = ["1-2-2026", "invalid", "10-12-2026"];
    expect(parseDateKeys(arrayData).sort()).toEqual(["1-2-2026", "10-12-2026"].sort());

    const legacyObj = {
      "1-2-2026": true,
      "other-key": "3-4-2026",
      "bad": "val"
    };
    expect(parseDateKeys(legacyObj).sort()).toEqual(["1-2-2026", "3-4-2026"].sort());
    
    expect(parseDateKeys(null)).toEqual([]);
  });
});
