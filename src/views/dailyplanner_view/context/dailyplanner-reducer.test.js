import dailyplannerReducer from './dailyplanner-reducer';
import * as actions from './dailyplanner-actions';
import * as constants from '../../../utils/constants';

describe('dailyplannerReducer', () => {
  let initialState;

  beforeEach(() => {
    initialState = {
      currentDate: new Date('2023-01-01'),
      time: '10:00',
      routines: [...constants.DEFAULT_ROUTINES],
      dailyBigs: [...constants.DEFAULT_DAILY_BIGS],
      tasks: [...constants.DEFAULT_TASKS],
      notes: 'Initial notes',
      dateKeys: ['01-01-2023']
    };
  });

  it('handles SET_DATE', () => {
    const newDate = new Date('2023-01-02');
    const newState = dailyplannerReducer(initialState, { type: actions.SET_DATE, payload: newDate });
    expect(newState.currentDate).toBe(newDate);
  });

  it('handles SET_TIME', () => {
    const newState = dailyplannerReducer(initialState, { type: actions.SET_TIME, payload: '12:00' });
    expect(newState.time).toBe('12:00');
  });

  it('resets time when payload is undefined', () => {
    const newState = dailyplannerReducer(initialState, { type: actions.SET_TIME, payload: undefined });
    expect(newState.time).toBe(constants.DEFAULT_TIME);
  });

  it('handles SET_NOTES', () => {
    const newState = dailyplannerReducer(initialState, { type: actions.SET_NOTES, payload: 'New notes' });
    expect(newState.notes).toBe('New notes');
  });

  it('resets notes when payload is undefined', () => {
    const newState = dailyplannerReducer(initialState, { type: actions.SET_NOTES, payload: undefined });
    expect(newState.notes).toBe(constants.DEFAULT_NOTES);
  });

  it('handles SET_DATE_KEYS', () => {
    const newState = dailyplannerReducer(initialState, { type: actions.SET_DATE_KEYS, payload: ['01-01-2023', '02-01-2023'] });
    expect(newState.dateKeys).toEqual(['01-01-2023', '02-01-2023']);
  });

  it('handles ADD_DATE_KEY', () => {
    const newState = dailyplannerReducer(initialState, { type: actions.ADD_DATE_KEY, payload: '02-01-2023' });
    expect(newState.dateKeys).toEqual(['01-01-2023', '02-01-2023']);
  });

  it('merges tasks correctly on SET_TASKS', () => {
    const payload = {
      1: { text: 'Task 2', checked: true }
    };
    const newState = dailyplannerReducer(initialState, { type: actions.SET_TASKS, payload });
    expect(newState.tasks[1]).toEqual({ text: 'Task 2', checked: true });
    // Other tasks should remain default
    expect(newState.tasks[0]).toEqual(constants.DEFAULT_TASKS[0]);
  });

  it('resets tasks when SET_TASKS payload is undefined', () => {
    const modifiedState = { ...initialState, tasks: [{ text: 'Old task', checked: true }] };
    const newState = dailyplannerReducer(modifiedState, { type: actions.SET_TASKS, payload: undefined });
    expect(newState.tasks).toEqual(constants.DEFAULT_TASKS);
    // Ensure it's a deep copy, not reference equality
    expect(newState.tasks).not.toBe(constants.DEFAULT_TASKS);
  });

  it('throws an error for unknown action type', () => {
    expect(() => {
      dailyplannerReducer(initialState, { type: 'UNKNOWN_ACTION' });
    }).toThrow('No case for action type UNKNOWN_ACTION in dailyplanner reducer.');
  });
});
