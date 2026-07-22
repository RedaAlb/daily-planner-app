import React from 'react';
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TasksView from './TasksView';
import { loadAllTasksData, updateDateTasks } from '../../utils/Firebase';
import { BrowserRouter } from 'react-router-dom';

// Mock the Firebase utils
vi.mock('../../utils/Firebase', () => ({
  loadAllTasksData: vi.fn(),
  updateDateTasks: vi.fn(),
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
  default: ({ task, onMoveToDate, onTaskUpdate }) => (
    <div data-testid={`task-${task.text}`}>
      <span>{task.text}</span>
      <button 
        data-testid={`update-btn-${task.text}`} 
        onClick={() => onTaskUpdate(0, { ...task, text: task.text + " updated" })}
      >
        Update
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
    loadAllTasksData.mockResolvedValue(mockData);
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

  it('calls updateDateTasks when a task is updated', async () => {
    await act(async () => {
      customRender(<TasksView />);
    });

    const updateBtn = screen.getByTestId('update-btn-Incomplete Task');
    
    await act(async () => {
      fireEvent.click(updateBtn);
    });

    expect(updateDateTasks).toHaveBeenCalledWith("22-6-2026", expect.arrayContaining([
      expect.objectContaining({ text: "Incomplete Task updated", checkIndex: 0 }),
      { text: "Completed Task", checkIndex: 1 },
      { text: "Migrated Task", checkIndex: 2 },
      { text: "", checkIndex: 0 }
    ]));
  });
});
