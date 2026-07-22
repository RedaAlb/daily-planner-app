import React, { memo, useContext, useEffect, useState } from "react";

import { Box, IconButton, TextareaAutosize } from "@mui/material";
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import EastIcon from '@mui/icons-material/East';
import DragHandleIcon from '@mui/icons-material/DragHandle';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker';
import gbLocale from "date-fns/locale/en-GB";

import dailyplannerContext from "./context/dailyplanner-context";
import useDebounce from "../../hooks/useDebounce";

import { initDate, updateTask, getDbDateKey, loadDate, updateDateTasks } from "../../utils/Firebase";
import { MAIN_COLOUR, MAIN_LINE_HEIGHT, SECONDARY_FONT_SIZE, TASK_ITEM_MIN_HEIGHT, NUM_TASK_ITEMS, TASKS_PATH } from "../../utils/constants";
import { SET_TASKS } from "./context/dailyplanner-actions";

import Tickbox from "../../components/Tickbox";


const tickIcons = [
  <CheckBoxOutlineBlankIcon fontSize="inherit" sx={{ color: MAIN_COLOUR }} />,
  <CheckBoxIcon fontSize="inherit" sx={{ color: MAIN_COLOUR }} />,
  <EastIcon fontSize="inherit" sx={{ color: MAIN_COLOUR }} />,
]


function DailyTaskItem(props) {
  const context = useContext(dailyplannerContext) || {};
  const { state, dispatch } = context;

  const [task, setTask] = useState(props.task);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const itemDate = props.date || state?.currentDate;

  const onTickClick = (checkIndex) => {
    const newTask = { ...task, checkIndex: checkIndex };
    setTask(newTask);
    
    if (props.onTaskUpdate) {
      props.onTaskUpdate(props.index, newTask);
    } else {
      updateTask(itemDate, props.index, newTask);
    }
  }


  const debouncedUpdateTask = useDebounce((newTask) => {
    if (props.onTaskUpdate) {
      props.onTaskUpdate(props.index, newTask);
    } else {
      updateTask(itemDate, props.index, newTask);
      initDate(itemDate, state?.time, dispatch);
    }
  }, 300);

  const onTextChange = (event) => {
    const textboxValue = event.target.value;
    const newTask = { ...task, text: textboxValue };

    setTask(newTask);
    debouncedUpdateTask(newTask);
  }

  const handleMoveToDate = async (targetDate) => {
    if (!targetDate) return;
    
    if (props.onMoveToDate) {
      props.onMoveToDate(task, props.index, targetDate, itemDate);
      return;
    }

    // Default implementation for Daily Planner View
    const targetDateKey = getDbDateKey(targetDate);
    const currentDateKey = getDbDateKey(itemDate);
    
    if (targetDateKey === currentDateKey) return;

    // Load target date data
    const targetDateData = await loadDate(targetDate);
    const targetTasks = targetDateData[TASKS_PATH] || Array.from({ length: NUM_TASK_ITEMS }, () => ({ checkIndex: 0, text: "" }));
    
    // Find empty slot
    let emptyIndex = targetTasks.findIndex(t => !t || !t.text || t.text === "");
    if (emptyIndex !== -1) {
      targetTasks[emptyIndex] = task;
    } else {
      targetTasks.push(task);
    }

    // Update target in Firebase
    updateDateTasks(targetDateKey, targetTasks);

    // Update current in Firebase & local state
    const currentTasks = state?.tasks ? [...state.tasks] : [];
    currentTasks[props.index] = { checkIndex: 0, text: "" };
    
    dispatch({ type: SET_TASKS, payload: currentTasks });
    updateDateTasks(currentDateKey, currentTasks);
  };

  const handleMoveNextDay = () => {
    const nextDay = new Date(itemDate);
    nextDay.setDate(nextDay.getDate() + 1);
    handleMoveToDate(nextDay);
  };


  useEffect(() => {
    setTask(props.task);
  }, [props.task])


  return (
    <div
      ref={props.innerRef}
      {...(props.draggableProps || {})}
      style={{
        display: "flex",
        alignItems: "center",
        borderBottom: `${MAIN_LINE_HEIGHT} solid ${MAIN_COLOUR}`,
        minHeight: TASK_ITEM_MIN_HEIGHT,
        ...(props.draggableProps ? props.draggableProps.style : {})
      }}
    >
      
      {props.dragHandleProps && (
        <Box {...props.dragHandleProps} sx={{ display: 'flex', alignItems: 'center', mr: 0.5 }}>
          <DragHandleIcon sx={{ color: MAIN_COLOUR }} />
        </Box>
      )}

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
          fontSize: SECONDARY_FONT_SIZE,
          marginLeft: "8px"
        }}
      />

      {(task.text !== "" || props.forceShowActions) && (
        <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={gbLocale}>
            <MobileDatePicker
              open={datePickerOpen}
              onClose={() => setDatePickerOpen(false)}
              onChange={(newDate) => {
                handleMoveToDate(newDate);
                setDatePickerOpen(false);
              }}
              renderInput={() => <span style={{ display: 'none' }} />}
              value={itemDate}
            />
          </LocalizationProvider>
          
          <IconButton 
            size="small" 
            onClick={() => setDatePickerOpen(true)}
            sx={{ color: MAIN_COLOUR, padding: '4px' }}
          >
            <CalendarTodayIcon fontSize="small" />
          </IconButton>
          
          <IconButton 
            size="small" 
            onClick={handleMoveNextDay}
            sx={{ color: MAIN_COLOUR, padding: '4px' }}
          >
            <EastIcon fontSize="small" />
          </IconButton>
        </Box>
      )}
    </div>
  )
}

export default memo(DailyTaskItem);