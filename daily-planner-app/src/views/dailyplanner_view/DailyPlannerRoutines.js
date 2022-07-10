import React from "react";

import CheckCircle from "../../components/CheckCircle";


function DailyPlannerRoutines(props) {
  const onMorningCheckChange = (checked) => {
    console.log("Morning routine", checked);
  }


  const onExerciseCheckChange = (checked) => {
    console.log("Exercise", checked);
  }


  const onEveningCheckChange = (checked) => {
    console.log("Evening routine", checked);
  }


  return (
    <div style={{ display: "flex", flexDirection: "column", paddingRight: "10px" }}>
      <CheckCircle text="Morning routine" onChange={onMorningCheckChange} />
      <CheckCircle text="Exercise" onChange={onExerciseCheckChange} />
      <CheckCircle text="Evening routine" onChange={onEveningCheckChange} />
    </div>
  )
}

export default DailyPlannerRoutines;