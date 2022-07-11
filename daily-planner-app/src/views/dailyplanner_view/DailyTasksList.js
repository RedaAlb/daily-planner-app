import React from "react";

import { NUM_TASK_ITEMS } from "../../utils/constants";

import Title from "../../components/Title";
import DailyTaskItem from "./DailyTaskItem";


function DailyTasksList(props) {
  return (
    <>
      <Title text="Other tasks" />

      {Array(NUM_TASK_ITEMS).fill(0).map((_, index) => (
        <DailyTaskItem key={index} index={index} />
      ))}
    </>
  )
}

export default DailyTasksList;