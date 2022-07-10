import React, { useState } from "react";

import { Checkbox, FormControlLabel } from "@mui/material";
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import { MAIN_COLOUR } from "../utils/constants";


function CheckCircle(props) {
  const [checked, setChecked] = useState(false);


  const onCheckChange = (event) => {
    const checkValue = event.target.checked;
    setChecked(checkValue);

    props.onChange(checkValue);
  }


  return (
    <FormControlLabel
      label={props.text}
      control={
        <Checkbox
          checked={checked}
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