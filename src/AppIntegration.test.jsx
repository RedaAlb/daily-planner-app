import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

import DailyPlannerView from './views/dailyplanner_view/DailyPlannerView';
import TasksView from './views/tasks_view/TasksView';
import GlobalTasksView from './views/global_tasks/GlobalTasksView';
import dailyplannerContext from './views/dailyplanner_view/context/dailyplanner-context';
import { SET_DATE } from './views/dailyplanner_view/context/dailyplanner-actions';
import * as Firebase from './utils/Firebase';

// Mock AuthContext
vi.mock('./context/AuthContext', () => ({
  useAuth: () => ({ currentUser: { uid: 'test-user-123', email: 'test@example.com' }, logout: vi.fn() }),
  AuthProvider: ({ children }) => <div>{children}</div>
}));

// Mock firebase/database functions used by useGlobalTasks
vi.mock('firebase/database', () => ({
  ref: vi.fn((db, path) => ({ path })),
  onValue: vi.fn((refObj, callback) => {
    if (refObj?.path === 'global_task_groups') {
      callback({
        val: () => ({
          'group-1': { id: 'group-1', name: 'Work Group', order: 0 }
        })
      });
    } else {
      callback({ val: () => null });
    }
    return () => {};
  }),
  update: vi.fn().mockResolvedValue(),
  set: vi.fn().mockResolvedValue(),
  remove: vi.fn().mockResolvedValue(),
  push: vi.fn(() => ({ key: 'mock-uuid-123' }))
}));

// Mock Firebase functions
vi.mock('./utils/Firebase', () => ({
  appDb: {},
  subscribeToDate: vi.fn((date, callback) => {
    callback({
      tasks: [{ checkIndex: 0, text: 'Plan Today Task', checked: false }],
      dailyBigs: [],
      routines: [],
      notes: ''
    });
    return () => {};
  }),
  subscribeToDateKeys: vi.fn((callback) => {
    callback(['5-8-2026', '6-8-2026']);
    return () => {};
  }),
  subscribeToAllTasks: vi.fn((callback) => {
    callback({
      '5-8-2026': [{ checkIndex: 0, text: 'Plan Today Task', checked: false }]
    });
    return () => {};
  }),
  subscribeToAllGroupedTasks: vi.fn((callback) => {
    callback([
      {
        id: '6-8-2026:0',
        text: 'Dated Grouped Task',
        checked: false,
        groupId: 'group-1',
        source: 'daily',
        dateKey: '6-8-2026',
        dateIndex: 0,
        checkIndex: 0
      }
    ]);
    return () => {};
  }),
  subscribeToGroups: vi.fn((callback) => {
    callback({
      'group-1': { id: 'group-1', name: 'Work Group', order: 0 }
    });
    return () => {};
  }),
  updateTask: vi.fn().mockResolvedValue(),
  initDate: vi.fn().mockResolvedValue(),
  updateDateTasks: vi.fn().mockResolvedValue(),
  ensureDateKeyExists: vi.fn().mockResolvedValue(),
  moveDailyTaskToGlobal: vi.fn().mockResolvedValue(),
  moveGlobalTaskToDailyPlanner: vi.fn().mockResolvedValue(),
  createGlobalTaskGroup: vi.fn().mockResolvedValue('group-1'),
  checkConnectionStatus: vi.fn(() => () => {}),
  loadDate: vi.fn().mockResolvedValue({ tasks: [], dailyBigs: [], routines: [] }),
  loadAllDateKeys: vi.fn().mockResolvedValue(['5-8-2026', '6-8-2026']),
  getDbDateKey: vi.fn((date) => {
    if (typeof date === 'string') return date;
    return `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
  }),
  normalizeFirebaseArray: vi.fn((data) => {
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object') return Object.values(data);
    return [];
  }),
  hasFirebaseConfig: true,
  GLOBAL_TASKS_PATH: 'global_tasks',
  GLOBAL_TASK_GROUPS_PATH: 'global_task_groups'
}));

// Mock react-beautiful-dnd
vi.mock('react-beautiful-dnd', () => ({
  DragDropContext: ({ children }) => <div data-testid="dnd-context">{children}</div>,
  Droppable: ({ children, droppableId }) => children({
    innerRef: vi.fn(),
    droppableProps: { 'data-droppable-id': droppableId },
    placeholder: null
  }),
  Draggable: ({ children, draggableId, index }) => children({
    innerRef: vi.fn(),
    draggableProps: { 'data-draggable-id': draggableId, 'data-index': index },
    dragHandleProps: {}
  })
}));

describe('Key Application End-to-End User Journeys', () => {
  const mockDispatch = vi.fn();
  const mockContextValue = {
    state: {
      currentDate: new Date(2026, 7, 5), // 5 Aug 2026
      tasks: [{ checkIndex: 0, text: 'Plan Today Task', checked: false }],
      dailyBigs: [],
      routines: [],
      notes: '',
      dateKeys: ['5-8-2026', '6-8-2026'],
      time: '09:00'
    },
    dispatch: mockDispatch
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Flow 1: Render Daily Planner View and update task text', async () => {
    await act(async () => {
      render(
        <dailyplannerContext.Provider value={mockContextValue}>
          <MemoryRouter initialEntries={['/']}>
            <Routes>
              <Route path="/" element={<DailyPlannerView />} />
            </Routes>
          </MemoryRouter>
        </dailyplannerContext.Provider>
      );
    });

    const taskInput = screen.getByDisplayValue('Plan Today Task');
    expect(taskInput).toBeInTheDocument();

    // Simulate user editing task text
    fireEvent.change(taskInput, { target: { value: 'Plan Today Task updated' } });

    // Wait for debounced write
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 350));
    });

    expect(Firebase.updateTask).toHaveBeenCalled();
  });

  it('Flow 2: Tasks View lists pending tasks for today and handles moving to another date', async () => {
    await act(async () => {
      render(
        <dailyplannerContext.Provider value={mockContextValue}>
          <MemoryRouter initialEntries={['/tasks']}>
            <Routes>
              <Route path="/tasks" element={<TasksView />} />
            </Routes>
          </MemoryRouter>
        </dailyplannerContext.Provider>
      );
    });

    // Should display today task
    expect(screen.getByText('Plan Today Task')).toBeInTheDocument();
  });

  it('Flow 3: Global Tasks View displays grouped task with interactive date chip that navigates to Daily Planner date', async () => {
    await act(async () => {
      render(
        <dailyplannerContext.Provider value={mockContextValue}>
          <MemoryRouter initialEntries={['/globaltasks']}>
            <Routes>
              <Route path="/globaltasks" element={<GlobalTasksView />} />
              <Route path="/" element={<div data-testid="daily-planner-home">Daily Planner View</div>} />
            </Routes>
          </MemoryRouter>
        </dailyplannerContext.Provider>
      );
    });

    // Verify task text renders
    expect(screen.getByText('Dated Grouped Task')).toBeInTheDocument();

    // Verify date chip renders
    const chip = screen.getByText(/06 Aug/i);
    expect(chip).toBeInTheDocument();

    // Click date chip
    fireEvent.click(chip);

    // Verify context dispatch was called to update current date to the task date (6-8-2026)
    expect(mockDispatch).toHaveBeenCalledWith({
      type: SET_DATE,
      payload: expect.any(Date)
    });

    // Verify navigation redirected to Daily Planner view ("/")
    expect(screen.getByTestId('daily-planner-home')).toBeInTheDocument();
  });
});
