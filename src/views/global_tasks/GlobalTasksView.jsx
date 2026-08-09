import React, { useState, useCallback, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";

import "../../css/global-tasks-view.css";

import GlobalTasksTopbar from "./GlobalTasksTopbar";
import OrderedList from "../../components/OrderedList";
import dailyplannerContext from "../dailyplanner_view/context/dailyplanner-context";
import { SET_DATE } from "../dailyplanner_view/context/dailyplanner-actions";

const STORAGE_KEY_GROUP_HANDLES = "global_tasks_show_group_drag_handles";
const STORAGE_KEY_TASK_HANDLES = "global_tasks_show_task_drag_handles";

function GlobalTasksView(props) {
  const dailyPlannerCtx = useContext(dailyplannerContext);
  const navigate = useNavigate();

  const handleDateClick = useCallback((dateObj) => {
    if (dailyPlannerCtx && dailyPlannerCtx.dispatch) {
      dailyPlannerCtx.dispatch({ type: SET_DATE, payload: dateObj });
    }
    navigate("/");
  }, [dailyPlannerCtx, navigate]);
  const [showGroupDragHandles, setShowGroupDragHandles] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_GROUP_HANDLES);
      return saved !== null ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  const [showTaskDragHandles, setShowTaskDragHandles] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TASK_HANDLES);
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_GROUP_HANDLES, JSON.stringify(showGroupDragHandles));
    } catch (e) {
      console.error("Failed to save group drag handle preference to localStorage", e);
    }
  }, [showGroupDragHandles]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TASK_HANDLES, JSON.stringify(showTaskDragHandles));
    } catch (e) {
      console.error("Failed to save task drag handle preference to localStorage", e);
    }
  }, [showTaskDragHandles]);

  const [isAllExpanded, setIsAllExpanded] = useState(true);
  const [toggleExpandAllSignal, setToggleExpandAllSignal] = useState(0);

  const handleToggleExpandAll = useCallback(() => {
    setToggleExpandAllSignal(prev => prev + 1);
  }, []);

  return (
    <div className="daily-planner-view">
      <GlobalTasksTopbar 
        showGroupDragHandles={showGroupDragHandles}
        setShowGroupDragHandles={setShowGroupDragHandles}
        showTaskDragHandles={showTaskDragHandles}
        setShowTaskDragHandles={setShowTaskDragHandles}
        isAllExpanded={isAllExpanded}
        onToggleExpandAll={handleToggleExpandAll}
      />

      <div className="daily-planner-content">
        <div className="global-notes">
          <OrderedList 
            showGroupDragHandles={showGroupDragHandles}
            showTaskDragHandles={showTaskDragHandles}
            toggleExpandAllSignal={toggleExpandAllSignal}
            setIsAllExpanded={setIsAllExpanded}
            onDateClick={handleDateClick}
          />
        </div>
      </div>
    </div>
  );
}

export default GlobalTasksView;