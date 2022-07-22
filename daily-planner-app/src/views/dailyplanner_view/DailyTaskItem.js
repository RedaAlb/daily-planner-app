import React, { memo, useEffect, useState } from "react";

import { Checkbox, TextareaAutosize } from "@mui/material";
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';

import { MAIN_COLOUR, MAIN_LINE_HEIGHT, SECONDARY_FONT_SIZE, TASK_ITEM_MIN_HEIGHT } from "../../utils/constants";


function DailyTaskItem(props) {
  const [task, setTask] = useState(props.task);


  const onCheckChange = (event) => {
    const checkValue = event.target.checked;

    const newTask = { ...task, checked: checkValue };
    setTask(newTask);
  }


  const onTextChange = (event) => {
    const textboxValue = event.target.value;

    const newTask = { ...task, text: textboxValue };
    setTask(newTask);
  }


  useEffect(() => {
    setTask(props.task);
  }, [props.task])


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
        checked={task.checked}
        onChange={onCheckChange}
        icon={<CheckBoxOutlineBlankIcon fontSize="inherit" sx={{ color: MAIN_COLOUR }} />}
        checkedIcon={<CheckBoxIcon fontSize="inherit" sx={{ color: MAIN_COLOUR }} />}
        sx={{ padding: 0, fontSize: "30px" }}
      />

      <TextareaAutosize
        value={task.text}
        onChange={onTextChange}
        style={{
          width: "100%",
          overflow: "hidden",
          fontSize: SECONDARY_FONT_SIZE
        }}
      />
    </div>
  )
}

export default memo(DailyTaskItem);