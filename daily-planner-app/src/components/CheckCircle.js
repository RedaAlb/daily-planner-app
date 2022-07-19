import React, { useContext, useEffect, useState } from "react";

import { Checkbox, FormControlLabel } from "@mui/material";
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import dailyplannerContext from "../views/dailyplanner_view/context/dailyplanner-context";

import { updateRoutine, setTime } from "../utils/Firebase";
import { MAIN_COLOUR } from "../utils/constants";


function CheckCircle(props) {
  const { state, dispatch } = useContext(dailyplannerContext);

  const [routine, setRoutine] = useState(props.routine);


  const onCheckChange = (event) => {
    const checkValue = event.target.checked;

    const newRoutine = { ...routine, checked: checkValue };
    setRoutine(newRoutine);
    updateRoutine(state.currentDate, props.index, newRoutine);

    setTime(state.currentDate, state.time, dispatch);
  }


  useEffect(() => {
    setRoutine(props.routine);
  }, [props.routine])


  return (
    <FormControlLabel
      label={props.text}
      control={
        <Checkbox
          checked={routine.checked}
          onChange={onCheckChange}
          icon={<RadioButtonUncheckedIcon fontSize="small" sx={{ color: MAIN_COLOUR }} />}
          checkedIcon={<CheckCircleIcon fontSize="small" sx={{ color: MAIN_COLOUR }} />}
          sx={{ padding: 0 }}
        />
      }
    />
  )
}

export default CheckCircle;