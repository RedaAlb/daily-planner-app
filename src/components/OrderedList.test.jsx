import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import OrderedList from './OrderedList';
import * as useGlobalTasksHook from '../hooks/useGlobalTasks';

// Mock react-beautiful-dnd
vi.mock('react-beautiful-dnd', () => ({
  DragDropContext: ({ children }) => <div data-testid="dnd-context">{children}</div>,
  Droppable: ({ children }) => children({
    innerRef: vi.fn(),
    droppableProps: {},
    placeholder: null
  }),
  Draggable: ({ children }) => children({
    innerRef: vi.fn(),
    draggableProps: {},
    dragHandleProps: {}
  })
}));

// Mock hook
vi.mock('../hooks/useGlobalTasks', () => ({
  default: vi.fn()
}));

// Mock ui components
vi.mock('./ui/DebouncedTextArea', () => ({
  __esModule: true,
  default: ({ value }) => <input data-testid="mock-textarea" value={value} readOnly />
}));

vi.mock('./GroupAssigner', () => ({
  __esModule: true,
  default: () => <div data-testid="mock-group-assigner" />
}));

describe('OrderedList', () => {
  const mockUnassignDate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useGlobalTasksHook.default.mockReturnValue({
      items: [],
      groups: {
        'group-1': { id: 'group-1', name: 'Test Group', order: 0 }
      },
      handleDragEnd: vi.fn(),
      moveToTop: vi.fn(),
      moveToBottom: vi.fn(),
      onAddTask: vi.fn(),
      toggleCheckbox: vi.fn(),
      handleTextChange: vi.fn(),
      confirmDelete: vi.fn(),
      createGroup: vi.fn(),
      assignGroup: vi.fn(),
      renameGroup: vi.fn(),
      deleteGroup: vi.fn(),
      unassignDate: mockUnassignDate
    });
  });

  it('renders a dated task with a dd/mm label and no drag handle', () => {
    useGlobalTasksHook.default.mockReturnValue({
      ...useGlobalTasksHook.default(),
      items: [
        { id: '1', text: 'Dated Task', checked: false, groupId: 'group-1', source: 'daily', dateKey: '5-8-2026' }
      ]
    });

    render(<OrderedList />);

    // Should render the date label "Wed 05 Aug"
    expect(screen.getByText('Wed 05 Aug')).toBeInTheDocument();
    
    // The drag handle icon (DragHandleIcon) should NOT be rendered for dated tasks
    expect(screen.queryByTestId('DragHandleIcon')).not.toBeInTheDocument();
  });

  it('renders an undated task without a date label and with a drag handle', () => {
    useGlobalTasksHook.default.mockReturnValue({
      ...useGlobalTasksHook.default(),
      items: [
        { id: '2', text: 'Undated Task', checked: false, groupId: 'group-1', source: 'global', order: 0 }
      ]
    });

    render(<OrderedList />);

    // Should NOT render any short date label (like "5/8")
    expect(screen.queryByText(/\d+\/\d+/)).not.toBeInTheDocument();
  });

  it('shows Remove date context menu item for dated tasks', () => {
    useGlobalTasksHook.default.mockReturnValue({
      ...useGlobalTasksHook.default(),
      items: [
        { id: '1', text: 'Dated Task', checked: false, groupId: 'group-1', source: 'daily', dateKey: '5-8-2026' }
      ]
    });

    render(<OrderedList />);

    // Open context menu
    const moreBtn = screen.getByTitle('More actions');
    fireEvent.click(moreBtn);

    // Should show "Remove date"
    const removeDateBtn = screen.getByText('Remove date');
    expect(removeDateBtn).toBeInTheDocument();

    // Clicking it should call unassignDate
    fireEvent.click(removeDateBtn);
    expect(mockUnassignDate).toHaveBeenCalledWith('1');
  });

  it('shows Move to date context menu item for undated tasks', () => {
    useGlobalTasksHook.default.mockReturnValue({
      ...useGlobalTasksHook.default(),
      items: [
        { id: '2', text: 'Undated Task', checked: false, groupId: 'group-1', source: 'global', order: 0 }
      ]
    });

    render(<OrderedList />);

    // Open context menu
    const moreBtn = screen.getByTitle('More actions');
    fireEvent.click(moreBtn);

    // Should show "Move to date..."
    expect(screen.getByText('Move to date...')).toBeInTheDocument();
    
    // Should NOT show "Remove date"
    expect(screen.queryByText('Remove date')).not.toBeInTheDocument();
  });
});
