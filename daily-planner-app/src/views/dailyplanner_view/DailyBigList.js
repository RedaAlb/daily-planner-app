import React from "react";

import Title from "../../components/Title";
import { NUM_DAILY_BIG_ITEMS } from "../../utils/constants";

import DailyBigItem from "./DailyBigItem";


function DailyBigList(props) {
  return (
    <div>
      <Title text="Daily Big 3" />

      {Array(NUM_DAILY_BIG_ITEMS).fill(0).map((_, index) => (
        <DailyBigItem key={index} index={index} />
      ))}
    </div>
  )
}

export default DailyBigList;