import React, { memo, useContext, useEffect, useState } from "react";

import { TextareaAutosize } from "@mui/material";
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import EastIcon from '@mui/icons-material/East';

import dailyplannerContext from "./context/dailyplanner-context";

import { initDate, updateTask } from "../../utils/Firebase";
import { MAIN_COLOUR, MAIN_LINE_HEIGHT, SECONDARY_FONT_SIZE, TASK_ITEM_MIN_HEIGHT } from "../../utils/constants";

import Tickbox from "../../components/Tickbox";


const tickIcons = [
  <CheckBoxOutlineBlankIcon fontSize="inherit" sx={{ color: MAIN_COLOUR }} />,
  <CheckBoxIcon fontSize="inherit" sx={{ color: MAIN_COLOUR }} />,
  <EastIcon fontSize="inherit" sx={{ color: MAIN_COLOUR }} />,
]


function DailyTaskItem(props) {
  const { state, dispatch } = useContext(dailyplannerContext);

  const [task, setTask] = useState(props.task);


  const onTickClick = (checkIndex) => {
    const newTask = { ...task, checkIndex: checkIndex };

    setTask(newTask);
    updateTask(state.currentDate, props.index, newTask);
  }


  const onTextChange = (event) => {
    const textboxValue = event.target.value;
    const newTask = { ...task, text: textboxValue };

    setTask(newTask);
    updateTask(state.currentDate, props.index, newTask);

    initDate(state.currentDate, state.time, dispatch);
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

      <Tickbox
        checkIndex={task.checkIndex}
        icons={tickIcons}
        onClick={onTickClick}
        style={{ padding: 0, fontSize: "30px" }}
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