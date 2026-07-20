import React, { useContext } from "react";

import dailyplannerContext from "./context/dailyplanner-context";

import Title from "../../components/Title";
import DailyTaskItem from "./DailyTaskItem";


function DailyTasksList(props) {
  const { state } = useContext(dailyplannerContext);


  return (
    <>
      <Title text="Other tasks" />

      {state.tasks.map((task, index) => (
        <DailyTaskItem
          key={index}
          index={index}
          task={task}
        />
      ))}
    </>
  )
}

export default DailyTasksList;