import React, { memo, useContext, useEffect, useState } from "react";

import { Box, IconButton, TextareaAutosize, Menu, MenuItem, ListItemIcon, ListItemText } from "@mui/material";
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import EastIcon from '@mui/icons-material/East';
import DragHandleIcon from '@mui/icons-material/DragHandle';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import FolderIcon from '@mui/icons-material/Folder';

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
import GroupAssigner from "../../components/GroupAssigner";



const tickIcons = [
  <CheckBoxOutlineBlankIcon fontSize="inherit" sx={{ color: MAIN_COLOUR }} />,
  <CheckBoxIcon fontSize="inherit" sx={{ color: MAIN_COLOUR }} />,
  <EastIcon fontSize="inherit" sx={{ color: MAIN_COLOUR }} />,
];


function DailyTaskItem(props) {
  const context = useContext(dailyplannerContext) || {};
  const { state, dispatch } = context;

  const [task, setTask] = useState(props.task);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const menuOpen = Boolean(anchorEl);
  const itemDate = props.date || state?.currentDate;

  const handleMenuClick = (e) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleContainerFocus = () => {
    setIsFocused(true);
  };

  const handleContainerBlur = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsFocused(false);
    }
  };

  const onTickClick = (checkIndex) => {
    const newTask = { ...task, checkIndex: checkIndex };
    setTask(newTask);
    
    if (props.onTaskUpdate) {
      props.onTaskUpdate(props.index, newTask);
    } else {
      updateTask(itemDate, props.index, newTask);
    }
  };


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
  };

  const handleBlur = (e) => {
    const currentTask = { ...task, text: e.target.value };
    if (props.onTaskUpdate) {
      props.onTaskUpdate(props.index, currentTask);
    } else {
      updateTask(itemDate, props.index, currentTask);
      initDate(itemDate, state?.time, dispatch);
    }
  };

  const handleMoveToDate = async (targetDate) => {
    if (!targetDate) return;

    setIsFocused(false);
    if (document.activeElement && typeof document.activeElement.blur === "function") {
      document.activeElement.blur();
    }
    
    if (props.onMoveToDate) {
      props.onMoveToDate(task, props.index, targetDate, itemDate);
      return;
    }

    const targetDateKey = getDbDateKey(targetDate);
    const currentDateKey = getDbDateKey(itemDate);
    
    if (targetDateKey === currentDateKey) return;

    const targetDateData = await loadDate(targetDate);
    const targetTasks = targetDateData[TASKS_PATH] || Array.from({ length: NUM_TASK_ITEMS }, () => ({ checkIndex: 0, text: "" }));
    
    let emptyIndex = targetTasks.findIndex(t => !t || !t.text || t.text === "");
    if (emptyIndex !== -1) {
      targetTasks[emptyIndex] = task;
    } else {
      targetTasks.push(task);
    }

    updateDateTasks(targetDateKey, targetTasks);

    const currentTasks = state?.tasks ? [...state.tasks] : [];
    currentTasks[props.index] = { checkIndex: 0, text: "" };
    
    updateDateTasks(currentDateKey, currentTasks);
  };

  const handleMoveNextDay = () => {
    handleMenuClose();
    setIsFocused(false);
    if (document.activeElement && typeof document.activeElement.blur === "function") {
      document.activeElement.blur();
    }
    const nextDay = new Date(itemDate);
    nextDay.setDate(nextDay.getDate() + 1);
    handleMoveToDate(nextDay);
  };

  const handleOpenDatePicker = () => {
    handleMenuClose();
    setDatePickerOpen(true);
  };

  const [assignerAnchorEl, setAssignerAnchorEl] = useState(null);

  const handleOpenAssignGroup = () => {
    setAssignerAnchorEl(anchorEl);
    handleMenuClose();
  };

  const handleCloseGroupAssigner = () => {
    setAssignerAnchorEl(null);
  };

  const handleAssignGroup = async (groupId) => {
    if (!groupId) return;
    setIsFocused(false);
    if (document.activeElement && typeof document.activeElement.blur === "function") {
      document.activeElement.blur();
    }

    if (props.onAssignGroup) {
      await props.onAssignGroup(task, props.index, groupId, itemDate);
      return;
    }

    // Just tag the task with the groupId — it stays on its date
    const newTask = { ...task, groupId };
    setTask(newTask);
    updateTask(itemDate, props.index, newTask);
    initDate(itemDate, state?.time, dispatch);
  };

  useEffect(() => {
    setTask(props.task);
  }, [props.task?.text, props.task?.checkIndex, props.task]);

  const hasText = Boolean(task?.text && task.text.trim() !== "");
  const showContextMenuButton = (hasText && isFocused) || menuOpen || props.forceShowActions;

  return (
    <div
      ref={props.innerRef}
      {...(props.draggableProps || {})}
      onFocus={handleContainerFocus}
      onBlur={handleContainerBlur}
      style={{
        display: "flex",
        alignItems: "center",
        borderBottom: `${MAIN_LINE_HEIGHT} solid ${MAIN_COLOUR}`,
        minHeight: TASK_ITEM_MIN_HEIGHT,
        width: "100%",
        boxSizing: "border-box",
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
        onBlur={handleBlur}
        style={{
          flex: 1,
          minWidth: 0,
          width: "100%",
          overflow: "hidden",
          fontSize: SECONDARY_FONT_SIZE
        }}
      />

      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={gbLocale}>
        <MobileDatePicker
          open={datePickerOpen}
          onClose={() => setDatePickerOpen(false)}
          onChange={(newDate) => {
            setDatePickerOpen(false);
            setIsFocused(false);
            if (document.activeElement && typeof document.activeElement.blur === "function") {
              document.activeElement.blur();
            }
            handleMoveToDate(newDate);
          }}
          renderInput={() => <span style={{ display: 'none' }} />}
          value={itemDate}
          DialogProps={{ disableScrollLock: true }}
        />
      </LocalizationProvider>

      {showContextMenuButton && (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flexShrink: 0, ml: 0.5 }}>
          <IconButton 
            size="small" 
            onClick={handleMenuClick}
            sx={{ color: MAIN_COLOUR, padding: '4px' }}
            title="More actions"
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Box>
      )}

      <Menu
        disableScrollLock={true}
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={handleOpenDatePicker}>
          <ListItemIcon><CalendarTodayIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Move to date...</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleMoveNextDay}>
          <ListItemIcon><EastIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Move to next day</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleOpenAssignGroup}>
          <ListItemIcon><FolderIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Assign group</ListItemText>
        </MenuItem>
      </Menu>

      <GroupAssigner
        anchorEl={assignerAnchorEl}
        onClose={handleCloseGroupAssigner}
        onAssignGroup={handleAssignGroup}
      />
    </div>
  );
}

export default memo(DailyTaskItem);