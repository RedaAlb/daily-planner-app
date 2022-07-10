import React from "react";

import { DEFAULT_HORI_GAP } from "../../utils/constants";

import DailyBigList from "./DailyBigList";


function DailyPlannerLeft(props) {
  return (
    <div className="daily-planner-left" style={{ marginRight: DEFAULT_HORI_GAP }}>
      <DailyBigList />
    </div>
  )
}

export default DailyPlannerLeft;