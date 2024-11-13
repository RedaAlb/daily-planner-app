import React from "react";
import DrawerComp from "../../components/DrawerComp";

import { MAIN_COLOUR, TOPBAR_LINE_HEIGHT } from "../../utils/constants";

function GymWeightsTopbar(props) {
  return (
    <div
      className="daily-planner-top"
      style={{
        borderBottom: `${TOPBAR_LINE_HEIGHT} solid ${MAIN_COLOUR}`
      }}
    >

      <DrawerComp />

      <h3 style={{ color: MAIN_COLOUR }}>
        Gym weights
      </h3>

    </div>
  )
}

export default GymWeightsTopbar;