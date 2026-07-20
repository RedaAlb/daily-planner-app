import React from "react";

import { Box } from "@mui/material";

import DateNavigation from "../../components/DateNavigation";
import DrawerComp from "../../components/DrawerComp";
import { MAIN_COLOUR, TOPBAR_HEIGHT, TOPBAR_LINE_HEIGHT } from "../../utils/constants";

import DailyPlannerRoutines from "./DailyPlannerRoutines";


function DailyPlannerTop(props) {
  return (
    <div
      className="daily-planner-top"
      style={{
        height: TOPBAR_HEIGHT,
        borderBottom: `${TOPBAR_LINE_HEIGHT} solid ${MAIN_COLOUR}`
      }}
    >
      <DrawerComp />
      <DateNavigation />

      <Box sx={{ flexGrow: 1 }} />

      <DailyPlannerRoutines />
    </div>
  )
}

export default DailyPlannerTop;