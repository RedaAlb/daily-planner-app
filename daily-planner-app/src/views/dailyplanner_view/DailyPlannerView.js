import React from "react";

import "../../css/dailyplanner-view.css"

import { DEFAULT_HORI_GAP } from "../../utils/constants";

import DailyPlannerTop from "./DailyPlannerTop";
import DailyPlannerLeft from "./DailyPlannerLeft";
import DailyPlannerRight from "./DailyPlannerRight";


function DailyPlannerView(props) {
  return (
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
  )
}

export default DailyPlannerView;