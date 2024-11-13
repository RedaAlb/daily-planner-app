import React, { useReducer } from "react";

import "../../css/gym-weights-view.css";


import DailyplannerContext from "../dailyplanner_view/context/dailyplanner-context";
import dailyplannerReducer from "../dailyplanner_view/context/dailyplanner-reducer";

import { INITIAL_STATE } from "../../utils/constants";

import GymWeightsTopbar from "./GymWeightsTopbar";
import WorkoutTracker from "../../components/WorkoutTracker";


function GymWeightsView(props) {
  const [state, dispatch] = useReducer(dailyplannerReducer, INITIAL_STATE);


  return (
    <DailyplannerContext.Provider value={{ state: state, dispatch: dispatch }}>
      <div className="daily-planner-view">
        <GymWeightsTopbar />

        <div className="daily-planner-content">
          <div className="gym-weights">
            <WorkoutTracker />
          </div>
        </div>
      </div>
    </DailyplannerContext.Provider>
  )
}

export default GymWeightsView;