import React, { memo, useContext, useEffect, useState } from "react";

import { Checkbox } from "@mui/material";
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import dailyplannerContext from "./context/dailyplanner-context";

import { setTime, updateDailyBig } from "../../utils/Firebase";
import { MAIN_COLOUR, MAIN_LINE_HEIGHT, PRIMARY_FONT_SIZE } from "../../utils/constants";


function DailyBigItem(props) {
  const { state, dispatch } = useContext(dailyplannerContext);

  const [dailyBig, setDailyBig] = useState(props.dailyBig);


  const onCheckChange = (event) => {
    const checkValue = event.target.checked;

    const newDailyBig = { ...dailyBig, checked: checkValue };
    setDailyBig(newDailyBig);
    updateDailyBig(state.currentDate, props.index, newDailyBig);
  }


  const onTextChange = (event) => {
    const textboxValue = event.target.value;

    const newDailyBig = { ...dailyBig, text: textboxValue }
    setDailyBig(newDailyBig);
    updateDailyBig(state.currentDate, props.index, newDailyBig);

    setTime(state.currentDate, state.time, dispatch);
  }


  useEffect(() => {
    setDailyBig(props.dailyBig);
  }, [props.dailyBig])


  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        borderBottom: `${MAIN_LINE_HEIGHT} solid ${MAIN_COLOUR}`
      }}
    >
      <Checkbox
        checked={dailyBig.checked}
        onChange={onCheckChange}
        icon={<RadioButtonUncheckedIcon fontSize="inherit" sx={{ color: MAIN_COLOUR }} />}
        checkedIcon={<CheckCircleIcon fontSize="inherit" sx={{ color: MAIN_COLOUR }} />}
        sx={{ padding: 0, fontSize: "42px" }}
      />

      <textarea
        value={dailyBig.text}
        onChange={onTextChange}
        rows={3}
        style={{
          width: "100%",
          fontSize: PRIMARY_FONT_SIZE,
          fontWeight: 600
        }}
      />
    </div>
  )
}

export default memo(DailyBigItem);