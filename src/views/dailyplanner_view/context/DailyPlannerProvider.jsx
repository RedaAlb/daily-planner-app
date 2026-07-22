import React from "react";
import dailyplannerContext from "./dailyplanner-context";
import useDailyPlanner from "../../../hooks/useDailyPlanner";

export function DailyPlannerProvider({ children }) {
  const plannerData = useDailyPlanner();

  return (
    <dailyplannerContext.Provider value={plannerData}>
      {children}
    </dailyplannerContext.Provider>
  );
}

export default DailyPlannerProvider;
