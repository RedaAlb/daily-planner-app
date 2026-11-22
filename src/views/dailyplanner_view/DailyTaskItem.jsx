import React, { memo, useContext, useEffect, useRef, useState } from "react";

import { Box, IconButton, TextareaAutosize, Menu, MenuItem, ListItemIcon, ListItemText, Chip } from "@mui/material";
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import EastIcon from '@mui/icons-material/East';
import DragHandleIcon from '@mui/icons-material/DragHandle';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import FolderIcon from '@mui/icons-material/Folder';
import EventBusyIcon from '@mui/icons-material/EventBusy';

import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker';
import gbLocale from "date-fns/locale/en-GB";

import dailyplannerContext from "./context/dailyplanner-context";
import useDebounce from "../../hooks/useDebounce";

import { initDate, updateTask, getDbDateKey, loadDate, updateDateTasks, ensureDateKeyExists, compactDateTasks } from "../../utils/Firebase";
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
  const isDirtyRef = useRef(false);

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

  const debouncedUpdateTask = useDebounce((newTask) => {
    isDirtyRef.current = false;
    if (props.onTaskUpdate) {
      props.onTaskUpdate(props.index, newTask);
    }
  }, 300);

  const debouncedUpdateTaskText = useDebounce((targetDate, targetTime, text) => {
    isDirtyRef.current = false;
    updateTask(targetDate, props.index, { text });
    if (text.trim() !== "") {
      initDate(targetDate, targetTime, dispatch);
    }
  }, 300);

  const onTickClick = (checkIndex) => {
    if (props.onTaskUpdate) {
      debouncedUpdateTask.flush();
    } else {
      debouncedUpdateTaskText.flush();
    }
    const isChecked = checkIndex === 1;
    const newTask = { ...task, checkIndex: checkIndex, checked: isChecked };
    setTask(newTask);

    if (props.onTaskUpdate) {
      props.onTaskUpdate(props.index, newTask);
    } else {
      updateTask(itemDate, props.index, newTask);
      if (checkIndex !== 0 || (newTask.text && newTask.text.trim() !== "")) {
        initDate(itemDate, state?.time, dispatch);
      }
    }
  };

  const onTextChange = (event) => {
    const textboxValue = event.target.value;
    const newTask = { ...task, text: textboxValue };

    isDirtyRef.current = true;
    setTask(newTask);
    if (props.onTaskUpdate) {
      debouncedUpdateTask(newTask);
    } else {
      debouncedUpdateTaskText(itemDate, state?.time, textboxValue);
    }
  };

  const handleBlur = () => {
    if (!isDirtyRef.current) return;
    if (props.onTaskUpdate) {
      debouncedUpdateTask.flush();
    } else {
      debouncedUpdateTaskText.flush();
    }
  };

  const itemDateKey = itemDate ? getDbDateKey(itemDate) : null;

  useEffect(() => {
    return () => {
      debouncedUpdateTask.flush();
      debouncedUpdateTaskText.flush();
    };
  }, [itemDateKey, debouncedUpdateTask, debouncedUpdateTaskText]);

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
    const targetTasks = targetDateData[TASKS_PATH]
      ? [...targetDateData[TASKS_PATH]]
      : Array.from({ length: NUM_TASK_ITEMS }, () => ({ checkIndex: 0, checked: false, text: "" }));

    let emptyIndex = targetTasks.findIndex(t => !t || !t.text || t.text === "");
    if (emptyIndex !== -1) {
      targetTasks[emptyIndex] = task;
    } else {
      targetTasks.push(task);
    }

    // Write to the target date first before clearing the source slot
    const targetSaved = await updateDateTasks(targetDateKey, targetTasks);
    if (targetSaved === false) return;
    await ensureDateKeyExists(targetDateKey);

    const currentTasks = state?.tasks ? [...state.tasks] : [];
    currentTasks[props.index] = { checkIndex: 0, checked: false, text: "" };

    const compactedCurrent = compactDateTasks(currentTasks);
    await updateDateTasks(currentDateKey, compactedCurrent);
    if (dispatch) {
      dispatch({ type: SET_TASKS, payload: compactedCurrent });
    }
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

  // Only offered when the parent provides onRemoveDate (Tasks view). The task moves to Global Tasks,
  // keeping its group if it has one, otherwise landing in "Unassigned".
  const handleRemoveDate = () => {
    handleMenuClose();
    setIsFocused(false);
    if (document.activeElement && typeof document.activeElement.blur === "function") {
      document.activeElement.blur();
    }
    if (props.onRemoveDate) {
      props.onRemoveDate(task, props.index, itemDate);
    }
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
    const normalizedGroupId = groupId || null;
    setIsFocused(false);
    if (document.activeElement && typeof document.activeElement.blur === "function") {
      document.activeElement.blur();
    }

    if (props.onAssignGroup) {
      await props.onAssignGroup(task, props.index, normalizedGroupId, itemDate);
      return;
    }

    // Tag (or clear) the task's groupId — it stays on its date
    const newTask = { ...task, groupId: normalizedGroupId };
    setTask(newTask);
    updateTask(itemDate, props.index, newTask);
    if (normalizedGroupId) {
      initDate(itemDate, state?.time, dispatch);
    }
  };

  useEffect(() => {
    isDirtyRef.current = false;
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
          {props.groupName && (
            <Chip
              label={props.groupName}
              size="small"
              sx={{
                height: 20,
                fontSize: "11px",
                fontWeight: 500,
                color: "white",
                backgroundColor: MAIN_COLOUR,
                mr: 0.5
              }}
            />
          )}
          <IconButton
            size="small"
            onClick={handleMenuClick}
            sx={{ color: MAIN_COLOUR, padding: '0px' }}
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
        {props.onRemoveDate && (
          <MenuItem onClick={handleRemoveDate}>
            <ListItemIcon><EventBusyIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Remove date</ListItemText>
          </MenuItem>
        )}
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