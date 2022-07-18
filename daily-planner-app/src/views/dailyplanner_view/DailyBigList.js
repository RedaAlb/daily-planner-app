import React, { useContext } from "react";

import dailyplannerContext from "./context/dailyplanner-context";

import Title from "../../components/Title";
import DailyBigItem from "./DailyBigItem";


function DailyBigList(props) {
  const { state } = useContext(dailyplannerContext);


  return (
    <>
      <Title text="Daily Big 3" />

      {state.dailyBigs.map((dailyBig, index) => (
        <DailyBigItem
          key={index}
          index={index}
          dailyBig={dailyBig}
        />
      ))}
    </>
  )
}

export default DailyBigList;