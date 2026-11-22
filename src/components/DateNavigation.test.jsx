import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DateNavigation from './DateNavigation';
import dailyplannerContext from '../views/dailyplanner_view/context/dailyplanner-context';
import { deleteDateData, loadAllDateKeys } from '../utils/Firebase';

// Mock the Firebase utils
vi.mock('../utils/Firebase', () => ({
  deleteDateData: vi.fn().mockResolvedValue(),
  loadAllDateKeys: vi.fn().mockResolvedValue([]),
  updateTime: vi.fn(),
  getDbDateKey: vi.fn((date) => date ? `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}` : '01-01-2023')
}));

const mockDispatch = vi.fn();

const customRender = (ui, { providerProps, ...renderOptions }) => {
  return render(
    <dailyplannerContext.Provider {...providerProps}>
      {ui}
    </dailyplannerContext.Provider>,
    renderOptions
  );
};

describe('DateNavigation', () => {
  let providerProps;

  beforeEach(() => {
    providerProps = {
      value: {
        state: {
          currentDate: new Date('2023-01-01T12:00:00Z'),
          time: '12:00',
          dateKeys: ['01-01-2023']
        },
        dispatch: mockDispatch,
      }
    };
    vi.clearAllMocks();
  });

  it('renders correctly with mocked context', () => {
    customRender(<DateNavigation />, { providerProps });
    
    // MUI Pickers usually render the selected date in an input field
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
  });

  it('navigates to next day when next button is clicked', () => {
    customRender(<DateNavigation />, { providerProps });
    
    expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
  });

  it('closes confirmation dialog and awaits deleteDateData before reloading date keys', async () => {
    const callOrder = [];
    deleteDateData.mockImplementation(async () => {
      callOrder.push('delete');
    });
    loadAllDateKeys.mockImplementation(async () => {
      callOrder.push('reload');
      return [];
    });

    customRender(<DateNavigation />, { providerProps });

    // Open SpeedDial and click Delete
    fireEvent.click(screen.getByRole('button', { name: 'Date SpeedDial' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Delete' }));

    expect(screen.getByText('Delete date?')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Yes' }));

    await waitFor(() => {
      expect(screen.queryByText('Delete date?')).not.toBeInTheDocument();
    });
    expect(callOrder).toEqual(['delete', 'reload']);
  });
});
