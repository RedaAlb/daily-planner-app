import React, { useState } from "react";

import { Checkbox } from "@mui/material";
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';

import { MAIN_COLOUR, MAIN_LINE_HEIGHT, TASK_ITEM_MIN_HEIGHT } from "../../utils/constants";

import AutoSizeTb from "../../components/AutoSizeTb";


function DailyTaskItem(props) {
  const [checked, setChecked] = useState(false);


  const onCheckChange = (event) => {
    const checkValue = event.target.checked;

    setChecked(checkValue);
    console.log("Task item", props.index, checkValue);
  }


  const onTaskTextChange = (textboxValue) => {
    console.log(textboxValue);
  }


  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        borderBottom: `${MAIN_LINE_HEIGHT} solid ${MAIN_COLOUR}`,
        minHeight: TASK_ITEM_MIN_HEIGHT
      }}
    >
      <Checkbox
        checked={checked}
        onChange={onCheckChange}
        icon={<CheckBoxOutlineBlankIcon fontSize="inherit" sx={{ color: MAIN_COLOUR }} />}
        checkedIcon={<CheckBoxIcon fontSize="inherit" sx={{ color: MAIN_COLOUR }} />}
        sx={{ padding: 0, fontSize: "30px" }}
      />

      <AutoSizeTb
        onTextChange={onTaskTextChange}
      />
    </div>
  )
}

export default DailyTaskItem;