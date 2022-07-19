import React, { useEffect, useReducer } from "react";

import "../../css/dailyplanner-view.css"

import DailyplannerContext from "./context/dailyplanner-context";
import dailyplannerReducer from "./context/dailyplanner-reducer";
import { SET_DAILYBIGS, SET_DATE_KEYS, SET_NOTES, SET_ROUTINES, SET_TASKS, SET_TIME } from "./context/dailyplanner-actions";

import { loadAllDateKeys, loadDate } from "../../utils/Firebase";
import { DEFAULT_HORI_GAP, INITIAL_STATE } from "../../utils/constants";

import DailyPlannerTop from "./DailyPlannerTop";
import DailyPlannerLeft from "./DailyPlannerLeft";
import DailyPlannerRight from "./DailyPlannerRight";


function DailyPlannerView(props) {
  const [state, dispatch] = useReducer(dailyplannerReducer, INITIAL_STATE);


  useEffect(() => {
    dispatch({ type: SET_TIME, payload: undefined });

    loadDate(state.currentDate).then(dateData => {
      dispatch({ type: SET_TIME, payload: dateData.time });
      dispatch({ type: SET_DAILYBIGS, payload: dateData.dailyBigs });
      dispatch({ type: SET_TASKS, payload: dateData.tasks });
      dispatch({ type: SET_ROUTINES, payload: dateData.routines });
      dispatch({ type: SET_NOTES, payload: dateData.notes });
    })
  }, [state.currentDate])


  useEffect(() => {
    loadAllDateKeys().then(dateKeys => {
      dispatch({ type: SET_DATE_KEYS, payload: dateKeys });
    })
  }, [])


  return (
    <DailyplannerContext.Provider value={{ state: state, dispatch: dispatch }}>
      <div className="daily-planner-view">
        <DailyPlannerTop />

        <div
          className="daily-planner-content"
          style={{ marginLeft: DEFAULT_HORI_GAP, marginRight: DEFAULT_HORI_GAP }}
        >
          <DailyPlannerLeft />
          <DailyPlannerRight />
        </div>
      </div>
    </DailyplannerContext.Provider>
  )
}

export default DailyPlannerView;