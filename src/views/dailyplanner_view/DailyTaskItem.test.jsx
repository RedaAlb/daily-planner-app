import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import DailyTaskItem from './DailyTaskItem';
import { updateTask } from '../../utils/Firebase';

vi.mock('../../utils/Firebase', () => ({
  updateTask: vi.fn(),
  getDbDateKey: vi.fn(),
  initDate: vi.fn()
}));

// Removed DebouncedTextArea mock as DailyTaskItem uses MUI TextareaAutosize

// Mock useAuth
vi.mock('../../hooks/useAuth', () => ({
  default: () => ({ currentUser: { uid: 'user123' } })
}));

describe('DailyTaskItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const defaultProps = {
    task: { text: 'Test Task', checkIndex: 0 },
    index: 0,
    showDragHandle: true,
    forceShowActions: true,
    date: new Date(2026, 7, 5),
    provided: {
      innerRef: vi.fn(),
      draggableProps: {},
      dragHandleProps: {}
    }
  };

  it('renders task text', () => {
    render(<DailyTaskItem {...defaultProps} />);
    expect(screen.getByRole('textbox')).toHaveValue('Test Task');
  });

  it('handleAssignGroup updates task in-place and does not clear it', async () => {
    // We render the component with a GroupAssigner mock to trigger the assign group directly
    vi.mock('../../components/GroupAssigner', () => ({
      __esModule: true,
      default: ({ onAssignGroup }) => (
        <button 
          data-testid="mock-assign-group" 
          onClick={() => onAssignGroup('group-123')}
        >
          Assign Group
        </button>
      )
    }));

    render(<DailyTaskItem {...defaultProps} />);
    
    // Open context menu
    const moreBtn = screen.getByTitle('More actions');
    fireEvent.click(moreBtn);

    // Open group assigner
    const assignMenuBtn = screen.getByText('Assign group');
    fireEvent.click(assignMenuBtn);

    // Trigger the assign
    const mockAssignBtn = await screen.findByTestId('mock-assign-group');
    fireEvent.click(mockAssignBtn);

    // Should call updateTask with the groupId
    expect(updateTask).toHaveBeenCalledWith(
      expect.any(Date),
      0,
      { text: 'Test Task', checkIndex: 0, groupId: 'group-123' }
    );

    // The task text should still be rendered (not cleared)
    expect(screen.getByRole('textbox')).toHaveValue('Test Task');
  });
});
