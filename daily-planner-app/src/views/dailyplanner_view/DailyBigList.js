import React from "react";

import { NUM_DAILY_BIG_ITEMS } from "../../utils/constants";

import Title from "../../components/Title";
import DailyBigItem from "./DailyBigItem";


function DailyBigList(props) {
  return (
    <>
      <Title text="Daily Big 3" />

      {Array(NUM_DAILY_BIG_ITEMS).fill(0).map((_, index) => (
        <DailyBigItem key={index} index={index} />
      ))}
    </>
  )
}

export default DailyBigList;