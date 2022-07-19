import React, { useContext, useEffect, useState } from "react";

import dailyplannerContext from "./context/dailyplanner-context";

import { MAIN_COLOUR, MAIN_LINE_HEIGHT, SECONDARY_FONT_SIZE } from "../../utils/constants";

import { initDate, updateNotes } from "../../utils/Firebase";
import Title from "../../components/Title";


function DailyNotes(props) {
  const { state, dispatch } = useContext(dailyplannerContext);

  const [notes, setNotes] = useState(state.notes);


  const onTextchange = (event) => {
    const textboxValue = event.target.value;

    setNotes(textboxValue);
    updateNotes(state.currentDate, textboxValue);

    initDate(state.currentDate, state.time, dispatch);
  }


  useEffect(() => {
    setNotes(state.notes);
  }, [state])


  return (
    <>
      <Title text="Notes" />

      <textarea
        value={notes}
        onChange={onTextchange}
        style={{
          height: "100%",
          border: `${MAIN_LINE_HEIGHT} solid ${MAIN_COLOUR}`,
          borderTop: "none",
          fontSize: SECONDARY_FONT_SIZE
        }}
      />
    </>
  )
}

export default DailyNotes;