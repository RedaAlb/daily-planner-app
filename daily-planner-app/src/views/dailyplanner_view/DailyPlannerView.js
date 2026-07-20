import React from "react";

import "../../css/dailyplanner-view.css"

import DailyplannerContext from "./context/dailyplanner-context";
import { DEFAULT_HORI_GAP } from "../../utils/constants";
import useDailyPlanner from "../../hooks/useDailyPlanner";

import DailyPlannerTop from "./DailyPlannerTop";
import DailyPlannerLeft from "./DailyPlannerLeft";
import DailyPlannerRight from "./DailyPlannerRight";

import LostConnection from "../../components/LostConnection";


function DailyPlannerView(props) {
  const { state, dispatch } = useDailyPlanner();

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

      <LostConnection />
    </DailyplannerContext.Provider>
  )
}

export default DailyPlannerView;