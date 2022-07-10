import React from "react";

import "../../css/dailyplanner-view.css"

import DailyPlannerLeft from "./DailyPlannerLeft";
import DailyPlannerRight from "./DailyPlannerRight";
import DailyPlannerTop from "./DailyPlannerTop";


function DailyPlannerView(props) {
  return (
    <div className="daily-planner-view">
      <DailyPlannerTop />

      <div className="daily-planner-content">
        <DailyPlannerLeft />
        <DailyPlannerRight />
      </div>
    </div>
  )
}

export default DailyPlannerView;