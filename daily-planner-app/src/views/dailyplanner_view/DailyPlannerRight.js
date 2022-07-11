import React from "react";

import DailyQuote from "./DailyQuote";
import DailyNotes from "./DailyNotes";


function DailyPlannerRight(props) {
  return (
    <div className="daily-planner-right">
      <DailyQuote />
      <DailyNotes />
    </div>
  )
}

export default DailyPlannerRight;