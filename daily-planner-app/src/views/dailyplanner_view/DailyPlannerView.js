import React, { useReducer } from "react";

import "../../css/dailyplanner-view.css"

import DailyplannerContext from "./context/dailyplanner-context";
import dailyplannerReducer from "./context/dailyplanner-reducer";

import { DEFAULT_HORI_GAP } from "../../utils/constants";

import DailyPlannerTop from "./DailyPlannerTop";
import DailyPlannerLeft from "./DailyPlannerLeft";
import DailyPlannerRight from "./DailyPlannerRight";


const initialState = {
  currentDate: new Date(),
  dateData: {}
}


function DailyPlannerView(props) {
  const [state, dispatch] = useReducer(dailyplannerReducer, initialState);


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