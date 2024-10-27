import React, { useReducer } from "react";

import "../../css/global-tasks-view.css";


import DailyplannerContext from "../dailyplanner_view/context/dailyplanner-context";
import dailyplannerReducer from "../dailyplanner_view/context/dailyplanner-reducer";

import { INITIAL_STATE } from "../../utils/constants";

import GlobalTasks from "./GlobalTasks";
import GlobalTasksTopbar from "./GlobalTasksTopbar";



function GlobalTasksView(props) {
  const [state, dispatch] = useReducer(dailyplannerReducer, INITIAL_STATE);


  return (
    <DailyplannerContext.Provider value={{ state: state, dispatch: dispatch }}>
      <div className="daily-planner-view">
        <GlobalTasksTopbar />

        <div className="daily-planner-content">
          <div className="global-notes">
            <GlobalTasks />
          </div>

        </div>
      </div>
    </DailyplannerContext.Provider>
  )
}

export default GlobalTasksView;