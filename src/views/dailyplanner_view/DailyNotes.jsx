import React, { useContext, useEffect, useRef, useState } from "react";

import dailyplannerContext from "./context/dailyplanner-context";
import useDebounce from "../../hooks/useDebounce";

import { MAIN_COLOUR, MAIN_LINE_HEIGHT, SECONDARY_FONT_SIZE } from "../../utils/constants";

import { initDate, updateNotes } from "../../utils/Firebase";
import Title from "../../components/Title";


function DailyNotes(props) {
  const { state, dispatch } = useContext(dailyplannerContext);

  const [notes, setNotes] = useState(state.notes);
  const isDirtyRef = useRef(false);

  const debouncedUpdateNotes = useDebounce((targetDate, targetTime, val) => {
    isDirtyRef.current = false;
    updateNotes(targetDate, val);
    if (val.trim() !== "") {
      initDate(targetDate, targetTime, dispatch);
    }
  }, 300);

  const onTextchange = (event) => {
    const textboxValue = event.target.value;

    isDirtyRef.current = true;
    setNotes(textboxValue);
    debouncedUpdateNotes(state.currentDate, state.time, textboxValue);
  }

  const handleBlur = () => {
    if (isDirtyRef.current) {
      debouncedUpdateNotes.flush();
    }
  };

  useEffect(() => {
    return () => {
      debouncedUpdateNotes.flush();
    };
  }, [state.currentDate, debouncedUpdateNotes]);

  useEffect(() => {
    isDirtyRef.current = false;
    setNotes(state.notes);
  }, [state.notes, state.currentDate])


  return (
    <>
      <Title text="Notes" />

      <textarea
        value={notes}
        onChange={onTextchange}
        onBlur={handleBlur}
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