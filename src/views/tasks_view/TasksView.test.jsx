import React from 'react';
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TasksView from './TasksView';
import { updateDateTasks, updateTask, subscribeToAllTasks, moveDailyTaskToGlobal } from '../../utils/Firebase';
import { BrowserRouter } from 'react-router-dom';

vi.mock('../../utils/Firebase', () => ({
  updateDateTasks: vi.fn(),
  updateTask: vi.fn(),
  subscribeToAllTasks: vi.fn(),
  subscribeToGroups: vi.fn((cb) => {
    cb({});
    return () => {};
  }),
  ensureDateKeyExists: vi.fn(),
  moveDailyTaskToGlobal: vi.fn(() => Promise.resolve('new-global-id')),
  normalizeFirebaseArray: vi.fn((data) => {
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object') {
      const arr = [];
      for (const [key, value] of Object.entries(data)) {
        const idx = parseInt(key, 10);
        if (!isNaN(idx)) arr[idx] = value;
      }
      return arr;
    }
    return [];
  }),
  getDbDateKey: vi.fn((date) => {
    return `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
  })
}));

// Mock react-beautiful-dnd to avoid DOM issues in testing
vi.mock('react-beautiful-dnd', () => ({
  DragDropContext: ({ children }) => <div data-testid="dnd-context">{children}</div>,
  Droppable: ({ children, droppableId }) => children({
    innerRef: vi.fn(),
    droppableProps: {
      'data-droppable-id': droppableId
    },
    placeholder: null
  }),
  Draggable: ({ children, draggableId, index }) => children({
    innerRef: vi.fn(),
    draggableProps: {
      'data-draggable-id': draggableId,
      'data-index': index
    },
    dragHandleProps: {}
  })
}));

// Mock DailyTaskItem
vi.mock('../dailyplanner_view/DailyTaskItem', () => ({
  __esModule: true,
  default: ({ task, onMoveToDate, onTaskUpdate, onAssignGroup, onRemoveDate, date }) => (
    <div data-testid={`task-${task.text}`}>
      <span>{task.text}</span>
      <button 
        data-testid={`update-btn-${task.text}`} 
        onClick={() => onTaskUpdate(0, { ...task, text: task.text + " updated" })}
      >
        Update
      </button>
      <button 
        data-testid={`move-btn-${task.text}`} 
        onClick={() => onMoveToDate(task, 0, new Date('2026-06-25'), date)}
      >
        Move
      </button>
      <button 
        data-testid={`assign-btn-${task.text}`} 
        onClick={() => onAssignGroup(task, 0, 'group-123', date)}
      >
        Assign
      </button>
      <button 
        data-testid={`remove-date-btn-${task.text}`} 
        onClick={() => onRemoveDate(task, 0, date)}
      >
        Remove date
      </button>
    </div>
  )
}));

// Mock TasksViewTopbar to prevent DrawerComp / useAuth from throwing
vi.mock('./TasksViewTopbar', () => ({
  __esModule: true,
  default: () => <div data-testid="topbar">Tasks TopBar Mock</div>
}));

const mockData = {
  "22-6-2026": [
    { text: "Incomplete Task", checkIndex: 0 },
    { text: "Completed Task", checkIndex: 1 },
    { text: "Migrated Task", checkIndex: 2 },
    { text: "", checkIndex: 0 }, // Empty
  ],
  "23-6-2026": [
    { text: "Another Incomplete Task", checkIndex: 0 },
  ]
};

const customRender = (ui) => {
  return render(
    <BrowserRouter>
      {ui}
    </BrowserRouter>
  );
};

describe('TasksView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    subscribeToAllTasks.mockImplementation((callback) => {
      callback(mockData);
      return () => {};
    });
  });

  it('fetches and renders only incomplete tasks', async () => {
    await act(async () => {
      customRender(<TasksView />);
    });

    // Should render headers for both days
    expect(screen.getByText(/Monday 22 June 2026/i)).toBeInTheDocument();
    expect(screen.getByText(/Tuesday 23 June 2026/i)).toBeInTheDocument();

    // Should only render incomplete tasks
    expect(screen.getByTestId('task-Incomplete Task')).toBeInTheDocument();
    expect(screen.getByTestId('task-Another Incomplete Task')).toBeInTheDocument();

    // Should NOT render completed, migrated or empty
    expect(screen.queryByTestId('task-Completed Task')).not.toBeInTheDocument();
    expect(screen.queryByTestId('task-Migrated Task')).not.toBeInTheDocument();
  });

  it('updates only the edited slot when a task is updated, without rewriting the whole date', async () => {
    await act(async () => {
      customRender(<TasksView />);
    });

    const updateBtn = screen.getByTestId('update-btn-Incomplete Task');
    
    await act(async () => {
      fireEvent.click(updateBtn);
    });

    // Path-level write for the single slot (no compaction, so indices stay stable while typing)
    expect(updateTask).toHaveBeenCalledTimes(1);
    const [dateArg, indexArg, fieldsArg] = updateTask.mock.calls[0];
    expect(dateArg).toBeInstanceOf(Date);
    expect(dateArg.getDate()).toBe(22);
    expect(dateArg.getMonth()).toBe(5);
    expect(dateArg.getFullYear()).toBe(2026);
    expect(indexArg).toBe(0);
    expect(fieldsArg).toEqual(expect.objectContaining({ text: "Incomplete Task updated", checkIndex: 0 }));
    expect(fieldsArg).not.toHaveProperty('originalIndex');

    // The whole-array (compacting) write must not be used for text edits
    expect(updateDateTasks).not.toHaveBeenCalled();

    // Edited text is reflected locally
    expect(screen.getByTestId('task-Incomplete Task updated')).toBeInTheDocument();
  });
  it('calls updateDateTasks correctly when a task is moved to another date', async () => {
    vi.useFakeTimers();
    await act(async () => {
      customRender(<TasksView />);
    });

    const moveBtn = screen.getByTestId('move-btn-Incomplete Task');
    
    await act(async () => {
      fireEvent.click(moveBtn);
    });
    
    act(() => {
      vi.runAllTimers();
    });

    // It should update the source date (22-6-2026) to clear the task
    expect(updateDateTasks).toHaveBeenCalledWith("22-6-2026", expect.arrayContaining([
      expect.objectContaining({ text: "", checkIndex: 0 }),
      { text: "Completed Task", checkIndex: 1 },
      { text: "Migrated Task", checkIndex: 2 },
      { text: "", checkIndex: 0 }
    ]));
    
    // It should update the target date (25-6-2026) to include the task without temporary originalIndex
    const targetCall = updateDateTasks.mock.calls.find(call => call[0] === "25-6-2026");
    expect(targetCall).toBeTruthy();
    expect(targetCall[1][0]).toEqual(expect.objectContaining({ text: "Incomplete Task", checkIndex: 0 }));
    expect(targetCall[1][0]).not.toHaveProperty('originalIndex');
    vi.useRealTimers();
  });

  it('calls updateDateTasks when assigning to a group, updating in-place', async () => {
    vi.useFakeTimers();
    await act(async () => {
      customRender(<TasksView />);
    });

    const assignBtn = screen.getByTestId('assign-btn-Incomplete Task');
    
    await act(async () => {
      fireEvent.click(assignBtn);
    });
    
    // Wait for promise resolution from async function
    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      vi.runAllTimers(); 
    });

    // Should update the daily planner in-place (adding groupId), NOT clear it, and strip originalIndex
    expect(updateDateTasks).toHaveBeenCalledWith("22-6-2026", expect.arrayContaining([
      expect.objectContaining({ text: "Incomplete Task", checkIndex: 0, groupId: 'group-123' }),
      { text: "Completed Task", checkIndex: 1 },
      { text: "Migrated Task", checkIndex: 2 },
      { text: "", checkIndex: 0 }
    ]));
    expect(updateDateTasks.mock.calls[0][1][0]).not.toHaveProperty('originalIndex');
    vi.useRealTimers();
  });

  it('moves the task to global tasks and hides it when the date is removed', async () => {
    await act(async () => {
      customRender(<TasksView />);
    });

    expect(screen.getByText("Incomplete Task")).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByTestId('remove-date-btn-Incomplete Task'));
    });

    // Ungrouped task goes to global tasks with groupId null (lands in "Unassigned")
    expect(moveDailyTaskToGlobal).toHaveBeenCalledWith("22-6-2026", 0, {
      text: "Incomplete Task",
      checkIndex: 0,
      groupId: null
    });

    // Task is removed from the list immediately (optimistic update)
    await waitFor(() => {
      expect(screen.queryByText("Incomplete Task")).not.toBeInTheDocument();
    });
  });

  it('preserves the group when removing the date from a grouped task', async () => {
    subscribeToAllTasks.mockImplementation((callback) => {
      callback({
        "22-6-2026": [
          { text: "Grouped Task", checkIndex: 0, groupId: 'group-123' },
        ]
      });
      return () => {};
    });

    await act(async () => {
      customRender(<TasksView />);
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId('remove-date-btn-Grouped Task'));
    });

    expect(moveDailyTaskToGlobal).toHaveBeenCalledWith("22-6-2026", 0, {
      text: "Grouped Task",
      checkIndex: 0,
      groupId: 'group-123'
    });
  });
});
