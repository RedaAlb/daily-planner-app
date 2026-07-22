import React, { useEffect, useState, useCallback, useContext, memo } from "react";
import { format, isToday } from "date-fns";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { useNavigate } from "react-router-dom";

import "./tasks-view.css";
import { loadAllTasksData, updateDateTasks, getDbDateKey, normalizeFirebaseArray } from "../../utils/Firebase";
import { NUM_TASK_ITEMS, DEFAULT_HORI_GAP, MAIN_COLOUR } from "../../utils/constants";
import { Chip } from "@mui/material";

import TasksViewTopbar from "./TasksViewTopbar";
import DailyTaskItem from "../dailyplanner_view/DailyTaskItem";
import dailyplannerContext from "../dailyplanner_view/context/dailyplanner-context";
import { SET_DATE } from "../dailyplanner_view/context/dailyplanner-actions";

const parseDateKey = (key) => {
  if (!key) return new Date();
  const [d, m, y] = key.split('-');
  return new Date(y, m - 1, d);
};

const TaskDateGroup = memo(function TaskDateGroup({
  dateKey,
  dateTasks,
  handleTaskUpdate,
  handleMoveToDate,
  onDateHeaderClick
}) {
  const dateObj = parseDateKey(dateKey);
  const isDateToday = isToday(dateObj);

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
              visibleTasks.map((task, visibleIndex) => (
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
                      onTaskUpdate={(index, updatedTask) => handleTaskUpdate(dateKey, index, updatedTask)}
                      onMoveToDate={handleMoveToDate}
                    />
                  )}
                </Draggable>
              ))
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
    const fetchTasks = async () => {
      const allTasks = await loadAllTasksData();
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

    fetchTasks();
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
        setSortedDateKeys(newKeys);
      }

      updateDateTasks(sourceDateKey, sourceTasks);
      updateDateTasks(targetDateKey, destTasks);

      return newGroups;
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
            newFullTasks[i] = { checkIndex: newVisible[visibleIdx].checkIndex, text: newVisible[visibleIdx].text };
            visibleIdx++;
          }
        }

        updateDateTasks(sourceDateKey, newFullTasks);
        return { ...prev, [sourceDateKey]: newFullTasks };
      } else {
        sourceTasks[draggedTask.originalIndex] = { checkIndex: 0, text: "" };

        const visibleDestTasks = destTasks
          .filter(t => t && t.text && typeof t.text === "string" && t.text.trim() !== "" && t.checkIndex === 0)
          .map(t => ({ checkIndex: t.checkIndex, text: t.text }));

        visibleDestTasks.splice(destination.index, 0, { checkIndex: draggedTask.checkIndex, text: draggedTask.text });

        const newDestTasks = [...destTasks];

        for (let i = 0; i < newDestTasks.length; i++) {
          if (newDestTasks[i] && newDestTasks[i].text && typeof newDestTasks[i].text === "string" && newDestTasks[i].text.trim() !== "" && newDestTasks[i].checkIndex === 0) {
            newDestTasks[i] = { checkIndex: 0, text: "" };
          }
        }

        let vIdx = 0;
        for (let i = 0; i < newDestTasks.length; i++) {
          if (vIdx >= visibleDestTasks.length) break;
          if (!newDestTasks[i] || !newDestTasks[i].text || typeof newDestTasks[i].text !== "string" || newDestTasks[i].text.trim() === "") {
            newDestTasks[i] = visibleDestTasks[vIdx];
            vIdx++;
          }
        }

        while (vIdx < visibleDestTasks.length) {
          newDestTasks.push(visibleDestTasks[vIdx]);
          vIdx++;
        }

        updateDateTasks(sourceDateKey, sourceTasks);
        updateDateTasks(destDateKey, newDestTasks);

        return {
          ...prev,
          [sourceDateKey]: sourceTasks,
          [destDateKey]: newDestTasks
        };
      }
    });
  }, []);

  if (loading) return null;

  const hasAnyPendingTasks = sortedDateKeys.some(dateKey => {
    const tasks = dateGroups[dateKey];
    const taskArray = normalizeFirebaseArray(tasks);
    return taskArray.some(t => t && t.text && typeof t.text === "string" && t.text.trim() !== "" && t.checkIndex === 0);
  });

  return (
    <div className="tasks-view">
      <TasksViewTopbar />

      <div className="tasks-view-content" style={{ marginLeft: DEFAULT_HORI_GAP, marginRight: DEFAULT_HORI_GAP, marginTop: "20px" }}>
        <DragDropContext onDragEnd={onDragEnd}>
          {sortedDateKeys.map((dateKey) => (
            <TaskDateGroup
              key={dateKey}
              dateKey={dateKey}
              dateTasks={dateGroups[dateKey]}
              handleTaskUpdate={handleTaskUpdate}
              handleMoveToDate={handleMoveToDate}
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
