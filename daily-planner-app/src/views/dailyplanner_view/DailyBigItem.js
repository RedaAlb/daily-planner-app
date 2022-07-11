import React, { useState } from "react";

import { Checkbox } from "@mui/material";
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import { MAIN_COLOUR, MAIN_LINE_HEIGHT, PRIMARY_FONT_SIZE } from "../../utils/constants";


function DailyBigItem(props) {
  const [checked, setChecked] = useState(false);


  const onCheckChange = (event) => {
    const checkValue = event.target.checked;
    setChecked(checkValue);

    console.log("Daily big item", props.index, checkValue);
  }


  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        borderBottom: `${MAIN_LINE_HEIGHT} solid ${MAIN_COLOUR}`
      }}
    >
      <Checkbox
        checked={checked}
        onChange={onCheckChange}
        icon={<RadioButtonUncheckedIcon fontSize="inherit" sx={{ color: MAIN_COLOUR }} />}
        checkedIcon={<CheckCircleIcon fontSize="inherit" sx={{ color: MAIN_COLOUR }} />}
        sx={{ padding: 0, fontSize: "42px" }}
      />

      <textarea
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

export default DailyBigItem;