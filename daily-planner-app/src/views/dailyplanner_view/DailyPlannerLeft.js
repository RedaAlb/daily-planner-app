import React from "react";

import { DEFAULT_HORI_GAP } from "../../utils/constants";

import DailyBigList from "./DailyBigList";
import DailyTasksList from "./DailyTasksList";


function DailyPlannerLeft(props) {
  return (
    <div className="daily-planner-left" style={{ marginRight: DEFAULT_HORI_GAP }}>
      <DailyBigList />
      <DailyTasksList />
    </div>
  )
}

export default DailyPlannerLeft;