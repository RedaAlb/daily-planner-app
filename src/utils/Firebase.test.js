import { vi, describe, it, expect, beforeEach } from 'vitest';
import * as db from 'firebase/database';
import {
  assignDailyTaskToGlobalGroup,
  moveGlobalTaskToDailyPlanner,
  createGlobalTaskGroup,
  ensureDateKeyExists
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
    remove: vi.fn().mockResolvedValue(),
    push: vi.fn(() => ({ key: 'mock-pushed-key-123' }))
  };
});

describe('Firebase integration helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('assignDailyTaskToGlobalGroup pushes a task to global_tasks in Firebase', async () => {
    const taskId = await assignDailyTaskToGlobalGroup('My Daily Task', false, 'group-abc');
    expect(taskId).toBe('mock-pushed-key-123');
    expect(db.push).toHaveBeenCalled();
    expect(db.set).toHaveBeenCalled();

    const setCall = db.set.mock.calls[0];
    const taskPayload = setCall[1];
    expect(taskPayload).toEqual({
      id: 'mock-pushed-key-123',
      text: 'My Daily Task',
      checked: false,
      order: 0,
      groupId: 'group-abc',
      createdAt: expect.any(Number)
    });
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
    await ensureDateKeyExists('5-8-2026');
    expect(db.get).toHaveBeenCalled();
    expect(db.push).toHaveBeenCalled();
    expect(db.set).toHaveBeenCalled();
  });

  it('moveGlobalTaskToDailyPlanner writes to target date tasks FIRST before removing from global_tasks', async () => {
    const globalTask = { id: 'global-task-999', text: 'Reviewed Task', checked: true };
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
  });

  it('round-trip flow: assigning daily task to group and moving it back to same date retains task text in empty slot', async () => {
    const todayDate = new Date(2026, 7, 5);

    // 1. Assign daily task to group
    const globalTaskId = await assignDailyTaskToGlobalGroup('Important Task', false, 'group-1');
    expect(globalTaskId).toBe('mock-pushed-key-123');

    // Mock loadDate to return cleared slots
    db.get.mockResolvedValueOnce({
      exists: () => true,
      val: () => ({
        tasks: [{ checkIndex: 0, text: '' }, { checkIndex: 0, text: '' }]
      })
    });

    // 2. Move global task back to same date
    const globalTask = { id: globalTaskId, text: 'Important Task', checked: false, groupId: 'group-1' };
    const success = await moveGlobalTaskToDailyPlanner(globalTask, todayDate);
    expect(success).toBe(true);

    // Verify set was called with the task restored into slot 0
    const setCalls = db.set.mock.calls;
    const tasksSetCall = setCalls.find(call => call[0]?.path === '5-8-2026/tasks/');
    const writtenTasks = tasksSetCall ? tasksSetCall[1] : setCalls[0][1];
    expect(writtenTasks[0]).toEqual({ checkIndex: 0, text: 'Important Task' });
  });
});
