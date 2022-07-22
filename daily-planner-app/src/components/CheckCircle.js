import React, { useEffect, useState } from "react";

import { Checkbox, FormControlLabel } from "@mui/material";
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import { MAIN_COLOUR } from "../utils/constants";


function CheckCircle(props) {
  const [routine, setRoutine] = useState(props.routine);


  const onCheckChange = (event) => {
    const checkValue = event.target.checked;

    const newRoutine = { ...routine, checked: checkValue };
    setRoutine(newRoutine);
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