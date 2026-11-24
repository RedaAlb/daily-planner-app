import { useReducer, useEffect } from "react";
import dailyplannerReducer from "../views/dailyplanner_view/context/dailyplanner-reducer";
import { 
  SET_DAILYBIGS, 
  SET_DATE_KEYS, 
  SET_NOTES, 
  SET_ROUTINES, 
  SET_TASKS, 
  SET_TIME 
} from "../views/dailyplanner_view/context/dailyplanner-actions";
import { loadAllDateKeys, loadDate, subscribeToDate, subscribeToDateKeys } from "../utils/Firebase";
import { INITIAL_STATE } from "../utils/constants";

export const useDailyPlanner = () => {
  const [state, dispatch] = useReducer(
    dailyplannerReducer,
    INITIAL_STATE,
    (initial) => ({ ...initial, currentDate: new Date() })
  );

  useEffect(() => {
    // Clear time while loading new date
    dispatch({ type: SET_TIME, payload: undefined });

    const unsubscribe = typeof subscribeToDate === "function" ? subscribeToDate(state.currentDate, (data) => {
      if (data) {
        dispatch({ type: SET_TIME, payload: data.time });
        dispatch({ type: SET_DAILYBIGS, payload: data.dailyBigs });
        dispatch({ type: SET_TASKS, payload: data.tasks });
        dispatch({ type: SET_ROUTINES, payload: data.routines });
        dispatch({ type: SET_NOTES, payload: data.notes });
      }
    }) : null;

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [state.currentDate]);

  useEffect(() => {
    const unsubscribe = typeof subscribeToDateKeys === "function" ? subscribeToDateKeys((dateKeys) => {
      dispatch({ type: SET_DATE_KEYS, payload: dateKeys || [] });
    }) : null;

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return { state, dispatch };
};

export default useDailyPlanner;
