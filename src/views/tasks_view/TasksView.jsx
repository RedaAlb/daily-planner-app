import React, { useEffect, useState } from "react";
import { format, isToday } from "date-fns";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

import "./tasks-view.css";
import { loadAllTasksData, updateDateTasks, getDbDateKey } from "../../utils/Firebase";
import { NUM_TASK_ITEMS, DEFAULT_HORI_GAP, MAIN_COLOUR } from "../../utils/constants";
import { Chip } from "@mui/material";

import TasksViewTopbar from "./TasksViewTopbar";
import DailyTaskItem from "../dailyplanner_view/DailyTaskItem";

const parseDateKey = (key) => {
  if (!key) return new Date();
  const [d, m, y] = key.split('-');
  return new Date(y, m - 1, d);
};


function TasksView() {
  const [dateGroups, setDateGroups] = useState({});
  const [sortedDateKeys, setSortedDateKeys] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      const allTasks = await loadAllTasksData();
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

  const handleTaskUpdate = (dateKey, originalIndex, updatedTask) => {
    const newTasksForDate = [...dateGroups[dateKey]];
    newTasksForDate[originalIndex] = updatedTask;

    setDateGroups(prev => ({ ...prev, [dateKey]: newTasksForDate }));
    updateDateTasks(dateKey, newTasksForDate);
  };

  const handleMoveToDate = (task, index, targetDate, sourceDate) => {
    const sourceDateKey = getDbDateKey(sourceDate);
    const targetDateKey = getDbDateKey(targetDate);

    if (sourceDateKey === targetDateKey) return;

    const sourceTasks = [...dateGroups[sourceDateKey]];
    sourceTasks[index] = { checkIndex: 0, text: "" };

    const destTasks = dateGroups[targetDateKey] ? [...dateGroups[targetDateKey]] : Array.from({ length: NUM_TASK_ITEMS }, () => ({ checkIndex: 0, text: "" }));

    let emptyIndex = destTasks.findIndex(t => !t || !t.text || t.text === "");
    if (emptyIndex !== -1) {
      destTasks[emptyIndex] = task;
    } else {
      destTasks.push(task);
    }

    setDateGroups(prev => {
      const newGroups = {
        ...prev,
        [sourceDateKey]: sourceTasks,
        [targetDateKey]: destTasks
      };

      // If new date group created, re-sort keys
      if (!prev[targetDateKey]) {
        const newKeys = Object.keys(newGroups).sort((a, b) => parseDateKey(a) - parseDateKey(b));
        setSortedDateKeys(newKeys);
      }

      return newGroups;
    });

    updateDateTasks(sourceDateKey, sourceTasks);
    updateDateTasks(targetDateKey, destTasks);
  };

  const onDragEnd = (result) => {
    const { source, destination } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const sourceDateKey = source.droppableId;
    const destDateKey = destination.droppableId;

    const sourceTasks = [...dateGroups[sourceDateKey]];
    const destTasks = sourceDateKey === destDateKey ? sourceTasks : [...dateGroups[destDateKey]];

    // Get visible tasks to find the dragged task
    const visibleSourceTasks = sourceTasks.map((t, i) => ({ ...t, originalIndex: i }))
      .filter(t => t && t.text && t.text.trim() !== "" && t.checkIndex === 0);

    const draggedTask = visibleSourceTasks[source.index];

    if (sourceDateKey === destDateKey) {
      // Reordering within the same day
      const newVisible = Array.from(visibleSourceTasks);
      newVisible.splice(source.index, 1);
      newVisible.splice(destination.index, 0, draggedTask);

      const newFullTasks = [...sourceTasks];
      let visibleIdx = 0;
      for (let i = 0; i < newFullTasks.length; i++) {
        const t = newFullTasks[i];
        if (t && t.text && t.text.trim() !== "" && t.checkIndex === 0) {
          newFullTasks[i] = { checkIndex: newVisible[visibleIdx].checkIndex, text: newVisible[visibleIdx].text };
          visibleIdx++;
        }
      }

      setDateGroups(prev => ({ ...prev, [sourceDateKey]: newFullTasks }));
      updateDateTasks(sourceDateKey, newFullTasks);
    } else {
      // Moving to different day
      sourceTasks[draggedTask.originalIndex] = { checkIndex: 0, text: "" };

      // Get existing visible tasks for the destination and strip extra metadata
      const visibleDestTasks = destTasks
        .filter(t => t && t.text && t.text.trim() !== "" && t.checkIndex === 0)
        .map(t => ({ checkIndex: t.checkIndex, text: t.text }));

      // Insert the dragged task at the specific dropped index
      visibleDestTasks.splice(destination.index, 0, { checkIndex: draggedTask.checkIndex, text: draggedTask.text });

      const newDestTasks = [...destTasks];

      // 1. Clear out all slots currently occupied by incomplete tasks to make room
      for (let i = 0; i < newDestTasks.length; i++) {
        if (newDestTasks[i] && newDestTasks[i].text && newDestTasks[i].text.trim() !== "" && newDestTasks[i].checkIndex === 0) {
          newDestTasks[i] = { checkIndex: 0, text: "" };
        }
      }

      // 2. Fill the empty slots sequentially with the newly ordered visible tasks
      let vIdx = 0;
      for (let i = 0; i < newDestTasks.length; i++) {
        if (vIdx >= visibleDestTasks.length) break;
        if (!newDestTasks[i] || !newDestTasks[i].text || newDestTasks[i].text.trim() === "") {
          newDestTasks[i] = visibleDestTasks[vIdx];
          vIdx++;
        }
      }

      // 3. If there are still tasks left (we exceeded the array length), append them
      while (vIdx < visibleDestTasks.length) {
        newDestTasks.push(visibleDestTasks[vIdx]);
        vIdx++;
      }

      setDateGroups(prev => ({
        ...prev,
        [sourceDateKey]: sourceTasks,
        [destDateKey]: newDestTasks
      }));
      updateDateTasks(sourceDateKey, sourceTasks);
      updateDateTasks(destDateKey, newDestTasks);
    }
  };

  if (loading) return null;

  const hasAnyPendingTasks = sortedDateKeys.some(dateKey =>
    dateGroups[dateKey]?.some(t => t && t.text && t.text.trim() !== "" && t.checkIndex === 0)
  );

  return (
    <div className="tasks-view">
      <TasksViewTopbar />

      <div className="tasks-view-content" style={{ marginLeft: DEFAULT_HORI_GAP, marginRight: DEFAULT_HORI_GAP, marginTop: "20px" }}>
        {!hasAnyPendingTasks ? (
          <div className="tasks-empty-state">
            <p>No pending tasks! All caught up.</p>
          </div>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            {sortedDateKeys.map((dateKey) => {
              const dateTasks = dateGroups[dateKey];
              if (!dateTasks) return null;

              const visibleTasks = dateTasks.map((t, i) => ({ ...t, originalIndex: i }))
                .filter(t => t && t.text && t.text.trim() !== "" && t.checkIndex === 0);

              if (visibleTasks.length === 0) return null;

              const dateObj = parseDateKey(dateKey);
              const formattedDate = format(dateObj, "EEEE d MMMM yyyy");
              const isDateToday = isToday(dateObj);

              return (
                <div key={dateKey} className="tasks-date-group">
                  <div className="tasks-date-heading" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {isDateToday && <Chip label="Today" size="small" sx={{ backgroundColor: MAIN_COLOUR, color: "white", fontWeight: "bold", height: "20px", fontSize: "11px" }} />}
                    <span>{formattedDate}</span>
                  </div>
                  <Droppable droppableId={dateKey}>
                    {(provided) => (
                      <div ref={provided.innerRef} {...provided.droppableProps}>
                        {visibleTasks.map((task, visibleIndex) => (
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
                                onTaskUpdate={(originalIndex, updatedTask) => handleTaskUpdate(dateKey, originalIndex, updatedTask)}
                                onMoveToDate={handleMoveToDate}
                              />
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </DragDropContext>
        )}
      </div>
    </div>
  );
}

export default TasksView;
