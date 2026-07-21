import { renderHook, act } from '@testing-library/react';
import useDailyPlanner from './useDailyPlanner';
import { loadDate, loadAllDateKeys } from '../utils/Firebase';
import { INITIAL_STATE } from '../utils/constants';

// Mock the Firebase utils
vi.mock('../utils/Firebase', () => ({
  loadDate: vi.fn(),
  loadAllDateKeys: vi.fn()
}));

// Mock the Date constructor to have a consistent initial state for testing
const mockDate = new Date('2023-01-01T12:00:00Z');
vi.spyOn(global, 'Date').mockImplementation(() => mockDate);

describe('useDailyPlanner hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock returns
    loadAllDateKeys.mockResolvedValue(['01-01-2023']);
    loadDate.mockResolvedValue({
      time: '14:30',
      dailyBigs: [{ text: 'Big Task', checked: false }],
      tasks: [{ text: 'Task 1', checked: true }],
      routines: [{ text: 'Morning Routine', checked: false }],
      notes: 'Some notes'
    });
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it('initializes with the INITIAL_STATE', async () => {
    // Act is required when testing hooks that trigger side effects (useEffect)
    let resultRef;
    await act(async () => {
      const { result } = renderHook(() => useDailyPlanner());
      resultRef = result;
    });

    // After side-effects, state should be updated with the mocked loadDate results
    expect(resultRef.current.state.time).toBe('14:30');
    expect(resultRef.current.state.notes).toBe('Some notes');
    expect(resultRef.current.state.dateKeys).toEqual(['01-01-2023']);
  });

  it('dispatches SET_DATE correctly', async () => {
    let resultRef;
    await act(async () => {
      const { result } = renderHook(() => useDailyPlanner());
      resultRef = result;
    });

    const newDate = new Date('2023-01-02T12:00:00Z');
    
    await act(async () => {
      resultRef.current.dispatch({ type: 'SET_DATE', payload: newDate });
    });

    expect(resultRef.current.state.currentDate).toBe(newDate);
    // Since currentDate changed, loadDate should have been called again (once on mount, once on change)
    expect(loadDate).toHaveBeenCalledTimes(2);
  });
});
