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
import { loadAllDateKeys, loadDate } from "../utils/Firebase";
import { INITIAL_STATE } from "../utils/constants";

export const useDailyPlanner = () => {
  const [state, dispatch] = useReducer(dailyplannerReducer, INITIAL_STATE);

  useEffect(() => {
    // Clear time while loading new date
    dispatch({ type: SET_TIME, payload: undefined });

    loadDate(state.currentDate).then((dateData) => {
      dispatch({ type: SET_TIME, payload: dateData.time });
      dispatch({ type: SET_DAILYBIGS, payload: dateData.dailyBigs });
      dispatch({ type: SET_TASKS, payload: dateData.tasks });
      dispatch({ type: SET_ROUTINES, payload: dateData.routines });
      dispatch({ type: SET_NOTES, payload: dateData.notes });
    });
  }, [state.currentDate]);

  useEffect(() => {
    loadAllDateKeys().then((dateKeys) => {
      dispatch({ type: SET_DATE_KEYS, payload: dateKeys });
    });
  }, []);

  return { state, dispatch };
};

export default useDailyPlanner;
