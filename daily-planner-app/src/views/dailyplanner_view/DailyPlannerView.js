import React, { useReducer, useEffect } from "react";

import { Backdrop, CircularProgress } from "@mui/material";

import "../../css/dailyplanner-view.css"

import DailyplannerContext from "./context/dailyplanner-context";
import dailyplannerReducer from "./context/dailyplanner-reducer";
import { SET_DAILYBIGS, SET_NOTES, SET_ROUTINES, SET_TASKS, SET_TIME } from "./context/dailyplanner-actions";

import { DEFAULT_HORI_GAP, INITIAL_STATE } from "../../utils/constants";

import DailyPlannerTop from "./DailyPlannerTop";
import DailyPlannerLeft from "./DailyPlannerLeft";
import DailyPlannerRight from "./DailyPlannerRight";


function DailyPlannerView(props) {
  const [state, dispatch] = useReducer(dailyplannerReducer, INITIAL_STATE);


  useEffect(() => {
    dispatch({ type: SET_TIME, payload: undefined });
    dispatch({ type: SET_DAILYBIGS, payload: undefined });
    dispatch({ type: SET_TASKS, payload: undefined });
    dispatch({ type: SET_ROUTINES, payload: undefined });
    dispatch({ type: SET_NOTES, payload: undefined });
  }, [state.currentDate])


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

      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={false}
      >
        <CircularProgress color="inherit" sx={{ marginRight: "10px" }} />
        <p>No internet connection...</p>
      </Backdrop>
    </DailyplannerContext.Provider>
  )
}

export default DailyPlannerView;