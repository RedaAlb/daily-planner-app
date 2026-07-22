import React from "react";

import DrawerComp from "../../components/DrawerComp";
import { MAIN_COLOUR, TOPBAR_HEIGHT, TOPBAR_LINE_HEIGHT } from "../../utils/constants";

function TasksViewTopbar() {
  return (
    <div
      className="daily-planner-top"
      style={{
        height: TOPBAR_HEIGHT,
        display: "flex",
        alignItems: "center",
        borderBottom: `${TOPBAR_LINE_HEIGHT} solid ${MAIN_COLOUR}`
      }}
    >
      <DrawerComp />

      <h3 style={{ color: MAIN_COLOUR, margin: 0, marginLeft: "8px" }}>
        Tasks
      </h3>
    </div>
  );
}

export default TasksViewTopbar;
