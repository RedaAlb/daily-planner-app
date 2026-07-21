import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import DeleteDialog from './DeleteDialog';

describe('DeleteDialog', () => {
  it('renders correctly when open', () => {
    render(<DeleteDialog open={true} itemText="Task 1" onClose={vi.fn()} onConfirm={vi.fn()} />);
    expect(screen.getByText('Confirm deletion')).toBeInTheDocument();
    expect(screen.getByText(/Task 1/i)).toBeInTheDocument();
  });

  it('calls onConfirm when Delete button is clicked', () => {
    const onConfirmMock = vi.fn();
    render(<DeleteDialog open={true} itemText="Task 1" onClose={vi.fn()} onConfirm={onConfirmMock} />);
    fireEvent.click(screen.getByRole('button', { name: /Delete/i }));
    expect(onConfirmMock).toHaveBeenCalled();
  });

  it('calls onClose when Cancel button is clicked', () => {
    const onCloseMock = vi.fn();
    render(<DeleteDialog open={true} itemText="Task 1" onClose={onCloseMock} onConfirm={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    expect(onCloseMock).toHaveBeenCalled();
  });
});
