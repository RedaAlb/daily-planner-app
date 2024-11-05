import React, { useReducer } from 'react';

import "../../css/archived-view.css";

import DailyplannerContext from "../dailyplanner_view/context/dailyplanner-context";
import dailyplannerReducer from "../dailyplanner_view/context/dailyplanner-reducer";

import { INITIAL_STATE } from "../../utils/constants";

import ArchivedTasks from "./ArchivedTasks";
import ArchivedTasksTopbar from "./ArchivedTasksTopbar";


function ArchivedTasksView(props) {
  const [state, dispatch] = useReducer(dailyplannerReducer, INITIAL_STATE)

  return (
    <DailyplannerContext.Provider value={{ state: state, dispatch: dispatch }}>
      <div className="daily-planner-view">
        <ArchivedTasksTopbar />

        <div className="daily-planner-content">
          <div className="archived-notes">
            <ArchivedTasks />
          </div>

        </div>
      </div>
    </DailyplannerContext.Provider>
  );
}

export default ArchivedTasksView;