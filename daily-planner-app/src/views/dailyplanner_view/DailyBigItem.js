import React, { memo, useContext, useEffect, useState } from "react";

import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EastIcon from '@mui/icons-material/East';

import dailyplannerContext from "./context/dailyplanner-context";

import { initDate, updateDailyBig } from "../../utils/Firebase";
import { MAIN_COLOUR, MAIN_LINE_HEIGHT, PRIMARY_FONT_SIZE } from "../../utils/constants";

import Tickbox from "../../components/Tickbox";


const tickIcons = [
  <RadioButtonUncheckedIcon fontSize="inherit" sx={{ color: MAIN_COLOUR }} />,
  <CheckCircleIcon fontSize="inherit" sx={{ color: MAIN_COLOUR }} />,
  <EastIcon fontSize="inherit" sx={{ color: MAIN_COLOUR }} />,
]


function DailyBigItem(props) {
  const { state, dispatch } = useContext(dailyplannerContext);

  const [dailyBig, setDailyBig] = useState(props.dailyBig);


  const onTickClick = (checkIndex) => {
    const newDailyBig = { ...dailyBig, checkIndex: checkIndex };

    setDailyBig(newDailyBig);
    updateDailyBig(state.currentDate, props.index, newDailyBig);
  }


  const onTextChange = (event) => {
    const textboxValue = event.target.value;
    const newDailyBig = { ...dailyBig, text: textboxValue }

    setDailyBig(newDailyBig);
    updateDailyBig(state.currentDate, props.index, newDailyBig);

    initDate(state.currentDate, state.time, dispatch);
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

      <Tickbox
        checkIndex={dailyBig.checkIndex}
        icons={tickIcons}
        onClick={onTickClick}
        style={{ padding: 0, fontSize: "42px" }}
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