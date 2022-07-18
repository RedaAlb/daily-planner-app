import React, { useContext } from "react";

import dailyplannerContext from "./context/dailyplanner-context";


import CheckCircle from "../../components/CheckCircle";


// 3 routines is a hard-coded value in constants.js
const ROUTINES_TEXT = [
  "Morning routine",
  "Exercise",
  "Evening routine"
]


function DailyPlannerRoutines(props) {
  const { state } = useContext(dailyplannerContext);


  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {state.routines.map((routine, index) => (
        <CheckCircle
          key={index}
          index={index}
          routine={routine}
          text={ROUTINES_TEXT[index]}
        />
      ))}
    </div>
  )
}

export default DailyPlannerRoutines;