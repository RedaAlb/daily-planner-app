import React, { useContext } from "react";

import "../../css/dailyplanner-view.css"

import DailyplannerContext from "./context/dailyplanner-context";
import { DEFAULT_HORI_GAP } from "../../utils/constants";
import useDailyPlanner from "../../hooks/useDailyPlanner";

import DailyPlannerTop from "./DailyPlannerTop";
import DailyPlannerLeft from "./DailyPlannerLeft";
import DailyPlannerRight from "./DailyPlannerRight";

import LostConnection from "../../components/LostConnection";


function DailyPlannerView(props) {
  const contextData = useContext(DailyplannerContext);
  const localData = useDailyPlanner();
  const { state, dispatch } = (contextData && contextData.state) ? contextData : localData;

  const content = (
    <>
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
    </>
  );

  if (contextData && contextData.state) {
    return content;
  }

  return (
    <DailyplannerContext.Provider value={{ state, dispatch }}>
      {content}
    </DailyplannerContext.Provider>
  );
}

export default DailyPlannerView;