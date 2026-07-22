import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BottomNavigation, BottomNavigationAction, Paper } from "@mui/material";
import TodayIcon from "@mui/icons-material/Today";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";
import { TASKS_VIEW_PATH } from "../utils/constants";

function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine the active value based on the path
  let activeValue = "/";
  if (location.pathname === TASKS_VIEW_PATH) {
    activeValue = TASKS_VIEW_PATH;
  }

  const handleChange = (event, newValue) => {
    navigate(newValue);
  };

  // Only show on the two primary routes
  if (location.pathname !== "/" && location.pathname !== TASKS_VIEW_PATH) {
    return null;
  }

  return (
    <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000 }} elevation={3}>
      <BottomNavigation
        showLabels
        value={activeValue}
        onChange={handleChange}
      >
        <BottomNavigationAction label="Daily Planner" value="/" icon={<TodayIcon />} />
        <BottomNavigationAction label="Tasks" value={TASKS_VIEW_PATH} icon={<FormatListNumberedIcon />} />
      </BottomNavigation>
    </Paper>
  );
}

export default BottomNav;
