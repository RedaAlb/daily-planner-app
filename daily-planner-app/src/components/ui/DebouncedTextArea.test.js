import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import DebouncedTextArea from './DebouncedTextArea';

jest.useFakeTimers();

describe('DebouncedTextArea', () => {
  it('updates local value immediately and debounces onChange', () => {
    const onChangeMock = jest.fn();
    render(<DebouncedTextArea value="initial" onChange={onChangeMock} />);
    
    // Find the textarea by initial value
    const textarea = screen.getByDisplayValue('initial');
    
    // Change value
    fireEvent.change(textarea, { target: { value: 'new text' } });
    
    // Local value updates immediately
    expect(textarea.value).toBe('new text');
    
    // Callback is debounced, so it's not called yet
    expect(onChangeMock).not.toHaveBeenCalled();
    
    // Fast forward time by 300ms
    act(() => {
      jest.advanceTimersByTime(300);
    });
    
    // Callback should now be called
    expect(onChangeMock).toHaveBeenCalledWith('new text');
  });
});
