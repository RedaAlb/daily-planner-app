import React, { useEffect, useState, useCallback, useContext, memo } from "react";
import { format, isToday } from "date-fns";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { useNavigate } from "react-router-dom";

import "./tasks-view.css";
import { updateDateTasks, getDbDateKey, normalizeFirebaseArray, subscribeToAllTasks, ensureDateKeyExists, compactDateTasks, subscribeToGroups, moveDailyTaskToGlobal } from "../../utils/Firebase";
import { NUM_TASK_ITEMS, DEFAULT_HORI_GAP, MAIN_COLOUR } from "../../utils/constants";


import { Chip, CircularProgress } from "@mui/material";

import TasksViewTopbar from "./TasksViewTopbar";
import DailyTaskItem from "../dailyplanner_view/DailyTaskItem";
import dailyplannerContext from "../dailyplanner_view/context/dailyplanner-context";
import { SET_DATE } from "../dailyplanner_view/context/dailyplanner-actions";

const parseDateKey = (key) => {
  if (!key || typeof key !== "string") return null;
  const parts = key.split('-');
  if (parts.length !== 3) return null;
  const [d, m, y] = parts;
  const dateObj = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
  return isNaN(dateObj.getTime()) ? null : dateObj;
};

const TaskDateGroup = memo(function TaskDateGroup({
  dateKey,
  dateTasks,
  groups,
  handleTaskUpdate,
  handleMoveToDate,
  handleAssignGroup,
  handleRemoveDate,
  onDateHeaderClick
}) {
  const dateObj = parseDateKey(dateKey);
  const isDateToday = dateObj ? isToday(dateObj) : false;

  const dateTasksArray = normalizeFirebaseArray(dateTasks);
  const visibleTasks = dateTasksArray
    .map((t, i) => ({ ...t, originalIndex: i }))
    .filter(t => t && t.text && typeof t.text === "string" && t.text.trim() !== "" && t.checkIndex === 0);

  if (visibleTasks.length === 0 && !isDateToday) return null;

  const formattedDate = format(dateObj, "EEEE d MMMM yyyy");

  return (
    <div className="tasks-date-group">
      <div
        className="tasks-date-heading"
        style={{ display: "flex", alignItems: "center", gap: "8px" }}
        onClick={() => onDateHeaderClick && onDateHeaderClick(dateObj)}
      >
        {isDateToday && (
          <Chip
            label="Today"
            size="small"
            sx={{ backgroundColor: MAIN_COLOUR, color: "white", fontWeight: "bold", height: "20px", fontSize: "11px" }}
          />
        )}
        <span>{formattedDate}</span>
      </div>
      <Droppable droppableId={dateKey}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            style={{
              minHeight: "40px"
            }}
          >
            {visibleTasks.length === 0 ? (
              <div style={{ padding: "10px 0", color: "#999999", fontSize: "14px", fontStyle: "italic" }}>
                No pending tasks.
              </div>
            ) : (
              visibleTasks.map((task, visibleIndex) => {
                const groupName = (task.groupId && groups && groups[task.groupId]) ? groups[task.groupId].name : null;
                return (
                  <Draggable key={`${dateKey}-${task.originalIndex}`} draggableId={`${dateKey}-${task.originalIndex}`} index={visibleIndex}>
                    {(provided) => (
                      <DailyTaskItem
                        innerRef={provided.innerRef}
                        draggableProps={provided.draggableProps}
                        dragHandleProps={provided.dragHandleProps}
                        task={task}
                        index={task.originalIndex}
                        date={dateObj}
                        forceShowActions={true}
                        groupName={groupName}
                        onTaskUpdate={(index, updatedTask) => handleTaskUpdate(dateKey, index, updatedTask)}
                        onMoveToDate={handleMoveToDate}
                        onAssignGroup={handleAssignGroup}
                        onRemoveDate={handleRemoveDate}
                      />
                    )}
                  </Draggable>
                );
              })
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
});

function TasksView() {
  const [dateGroups, setDateGroups] = useState({});
  const [sortedDateKeys, setSortedDateKeys] = useState([]);
  const [groups, setGroups] = useState({});
  const [loading, setLoading] = useState(true);

  const dailyPlannerCtx = useContext(dailyplannerContext);
  const navigate = useNavigate();

  const handleDateHeaderClick = useCallback((dateObj) => {
    if (dailyPlannerCtx && dailyPlannerCtx.dispatch) {
      dailyPlannerCtx.dispatch({ type: SET_DATE, payload: dateObj });
    }
    navigate("/");
  }, [dailyPlannerCtx, navigate]);

  useEffect(() => {
    const processAllTasks = (allTasks) => {
      const todayKey = getDbDateKey(new Date());

      if (!allTasks[todayKey]) {
        allTasks[todayKey] = Array.from({ length: NUM_TASK_ITEMS }, () => ({ checkIndex: 0, text: "" }));
      }

      setDateGroups(allTasks);

      // Sort dates oldest to newest
      const keys = Object.keys(allTasks).sort((a, b) => {
        const dateA = parseDateKey(a);
        const dateB = parseDateKey(b);
        return dateA - dateB;
      });
      setSortedDateKeys(keys);
      setLoading(false);
    };

    const unsubscribeTasks = typeof subscribeToAllTasks === "function" ? subscribeToAllTasks(processAllTasks) : null;
    const unsubscribeGroups = typeof subscribeToGroups === "function" ? subscribeToGroups(setGroups) : null;

    return () => {
      if (unsubscribeTasks) unsubscribeTasks();
      if (unsubscribeGroups) unsubscribeGroups();
    };
  }, []);

  const handleTaskUpdate = useCallback((dateKey, originalIndex, updatedTask) => {
    setDateGroups(prev => {
      const currentDateTasks = prev[dateKey] ? [...prev[dateKey]] : [];
      currentDateTasks[originalIndex] = updatedTask;
      updateDateTasks(dateKey, currentDateTasks);
      return { ...prev, [dateKey]: currentDateTasks };
    });
  }, []);

  const handleMoveToDate = useCallback((task, index, targetDate, sourceDate) => {
    const sourceDateKey = getDbDateKey(sourceDate);
    const targetDateKey = getDbDateKey(targetDate);

    if (sourceDateKey === targetDateKey) return;

    setDateGroups(prev => {
      const sourceTasks = prev[sourceDateKey] ? [...prev[sourceDateKey]] : [];
      sourceTasks[index] = { checkIndex: 0, text: "" };

      const destTasks = prev[targetDateKey] ? [...prev[targetDateKey]] : Array.from({ length: NUM_TASK_ITEMS }, () => ({ checkIndex: 0, text: "" }));

      let emptyIndex = destTasks.findIndex(t => !t || !t.text || t.text === "");
      if (emptyIndex !== -1) {
        destTasks[emptyIndex] = task;
      } else {
        destTasks.push(task);
      }

      const newGroups = {
        ...prev,
        [sourceDateKey]: sourceTasks,
        [targetDateKey]: destTasks
      };

      if (!prev[targetDateKey]) {
        const newKeys = Object.keys(newGroups).sort((a, b) => parseDateKey(a) - parseDateKey(b));
        // Note: setting state inside another setState updater is okay in React 18 (it batches), 
        // but to be perfectly safe from side-effect rules, it's better. We'll leave it as is 
        // since it's just another state update.
        setTimeout(() => setSortedDateKeys(newKeys), 0);
      }

      setTimeout(() => {
        updateDateTasks(sourceDateKey, sourceTasks);
        updateDateTasks(targetDateKey, destTasks);
        ensureDateKeyExists(targetDateKey);
      }, 0);

      return newGroups;
    });
  }, []);

  const handleAssignGroup = useCallback(async (task, index, groupId, sourceDate) => {
    // Just tag the task with the groupId — it stays on its date
    const sourceDateKey = getDbDateKey(sourceDate);
    const updatedTask = { ...task, groupId };
    setDateGroups(prev => {
      const sourceTasks = prev[sourceDateKey] ? [...prev[sourceDateKey]] : [];
      sourceTasks[index] = updatedTask;
      setTimeout(() => {
        updateDateTasks(sourceDateKey, sourceTasks);
      }, 0);

      return {
        ...prev,
        [sourceDateKey]: sourceTasks
      };
    });
  }, []);

  const handleRemoveDate = useCallback((task, index, sourceDate) => {
    // Move the task to Global Tasks (under its group, or "Unassigned" if it has none) and clear the daily slot
    const sourceDateKey = getDbDateKey(sourceDate);
    const { originalIndex, ...taskData } = task;

    setDateGroups(prev => {
      const sourceTasks = prev[sourceDateKey] ? [...prev[sourceDateKey]] : [];
      sourceTasks[index] = { checkIndex: 0, text: "" };
      return { ...prev, [sourceDateKey]: sourceTasks };
    });

    moveDailyTaskToGlobal(sourceDateKey, index, {
      text: taskData.text,
      checkIndex: taskData.checkIndex ?? 0,
      groupId: taskData.groupId || null
    });
  }, []);

  const onDragEnd = useCallback((result) => {
    const { source, destination } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const sourceDateKey = source.droppableId;
    const destDateKey = destination.droppableId;

    setDateGroups(prev => {
      const rawSource = prev[sourceDateKey] || [];
      const sourceTasks = normalizeFirebaseArray(rawSource);

      const rawDest = prev[destDateKey] || [];
      const destTasks = sourceDateKey === destDateKey
        ? sourceTasks
        : normalizeFirebaseArray(rawDest);

      const visibleSourceTasks = sourceTasks.map((t, i) => ({ ...t, originalIndex: i }))
        .filter(t => t && t.text && typeof t.text === "string" && t.text.trim() !== "" && t.checkIndex === 0);

      const draggedTask = visibleSourceTasks[source.index];
      if (!draggedTask) return prev;

      if (sourceDateKey === destDateKey) {
        const newVisible = Array.from(visibleSourceTasks);
        newVisible.splice(source.index, 1);
        newVisible.splice(destination.index, 0, draggedTask);

        const newFullTasks = [...sourceTasks];
        let visibleIdx = 0;
        for (let i = 0; i < newFullTasks.length; i++) {
          const t = newFullTasks[i];
          if (t && t.text && typeof t.text === "string" && t.text.trim() !== "" && t.checkIndex === 0) {
            const { originalIndex, ...preservedTask } = newVisible[visibleIdx];
            newFullTasks[i] = preservedTask;
            visibleIdx++;
          }
        }

        const compactedFull = compactDateTasks(newFullTasks);
        updateDateTasks(sourceDateKey, compactedFull);
        return { ...prev, [sourceDateKey]: compactedFull };
      } else {
        sourceTasks[draggedTask.originalIndex] = { checkIndex: 0, text: "" };

        const visibleDestTasks = destTasks
          .filter(t => t && t.text && typeof t.text === "string" && t.text.trim() !== "" && t.checkIndex === 0);

        const { originalIndex: _, ...draggedPreserved } = draggedTask;

        let actualIndex = 0;
        if (destination.index < visibleDestTasks.length) {
          let visibleCount = 0;
          for (let i = 0; i < destTasks.length; i++) {
            if (destTasks[i] && destTasks[i].text && typeof destTasks[i].text === "string" && destTasks[i].text.trim() !== "" && destTasks[i].checkIndex === 0) {
              if (visibleCount === destination.index) {
                actualIndex = i;
                break;
              }
              visibleCount++;
            }
          }
        } else if (visibleDestTasks.length > 0) {
          let lastVisibleIdx = -1;
          for (let i = 0; i < destTasks.length; i++) {
            if (destTasks[i] && destTasks[i].text && typeof destTasks[i].text === "string" && destTasks[i].text.trim() !== "" && destTasks[i].checkIndex === 0) {
              lastVisibleIdx = i;
            }
          }
          actualIndex = lastVisibleIdx + 1;
        } else {
          actualIndex = 0;
        }

        const newDestTasks = [...destTasks];
        newDestTasks.splice(actualIndex, 0, draggedPreserved);

        const compactedSource = compactDateTasks(sourceTasks);
        const compactedDest = compactDateTasks(newDestTasks);

        updateDateTasks(sourceDateKey, compactedSource);
        updateDateTasks(destDateKey, compactedDest);
        ensureDateKeyExists(destDateKey);

        return {
          ...prev,
          [sourceDateKey]: compactedSource,
          [destDateKey]: compactedDest
        };
      }
    });
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress sx={{ color: MAIN_COLOUR }} />
      </div>
    );
  }

  const activeDateKeys = sortedDateKeys.filter(dateKey => {
    const dateObj = parseDateKey(dateKey);
    if (!dateObj) return false;
    if (isToday(dateObj)) return true; // Always show today

    const tasks = dateGroups[dateKey];
    const taskArray = normalizeFirebaseArray(tasks);
    return taskArray.some(t => t && t.text && typeof t.text === "string" && t.text.trim() !== "" && t.checkIndex === 0);
  });

  const hasAnyPendingTasks = activeDateKeys.some(dateKey => {
    const tasks = dateGroups[dateKey];
    const taskArray = normalizeFirebaseArray(tasks);
    return taskArray.some(t => t && t.text && typeof t.text === "string" && t.text.trim() !== "" && t.checkIndex === 0);
  });

  return (
    <div className="tasks-view">
      <TasksViewTopbar />

      <div className="tasks-view-content" style={{ marginLeft: DEFAULT_HORI_GAP, marginRight: DEFAULT_HORI_GAP, marginTop: "20px" }}>
        <DragDropContext onDragEnd={onDragEnd}>
          {activeDateKeys.map((dateKey) => (
            <TaskDateGroup
              key={dateKey}
              dateKey={dateKey}
              dateTasks={dateGroups[dateKey]}
              groups={groups}
              handleTaskUpdate={handleTaskUpdate}
              handleMoveToDate={handleMoveToDate}
              handleAssignGroup={handleAssignGroup}
              handleRemoveDate={handleRemoveDate}
              onDateHeaderClick={handleDateHeaderClick}
            />
          ))}
        </DragDropContext>

        {!hasAnyPendingTasks && (
          <div className="tasks-empty-state">
            <p>No pending tasks! All caught up.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default TasksView;
