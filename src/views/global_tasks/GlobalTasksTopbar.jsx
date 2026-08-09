import React, { useState } from "react";
import { Box, IconButton, Menu, MenuItem, Checkbox, ListItemText } from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import UnfoldLessIcon from "@mui/icons-material/UnfoldLess";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";

import DrawerComp from "../../components/DrawerComp";
import { MAIN_COLOUR, TOPBAR_HEIGHT, TOPBAR_LINE_HEIGHT, DEFAULT_HORI_GAP } from "../../utils/constants";

function GlobalTasksTopbar({
  showGroupDragHandles = false,
  setShowGroupDragHandles,
  showTaskDragHandles = true,
  setShowTaskDragHandles,
  isAllExpanded = true,
  onToggleExpandAll
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <div
      className="daily-planner-top"
      style={{
        height: TOPBAR_HEIGHT,
        display: "flex",
        alignItems: "center",
        borderBottom: `${TOPBAR_LINE_HEIGHT} solid ${MAIN_COLOUR}`,
        paddingRight: DEFAULT_HORI_GAP
      }}
    >
      <DrawerComp />

      <h3 style={{ color: MAIN_COLOUR, margin: 0, marginLeft: "8px" }}>
        Global Tasks
      </h3>

      <Box sx={{ ml: "auto", display: "flex", alignItems: "center", gap: 0.5 }}>
        <IconButton
          onClick={onToggleExpandAll}
          title={isAllExpanded ? "Collapse all groups" : "Expand all groups"}
          sx={{ color: MAIN_COLOUR }}
        >
          {isAllExpanded ? <UnfoldLessIcon /> : <UnfoldMoreIcon />}
        </IconButton>

        <IconButton
          onClick={handleMenuClick}
          title="View options"
          sx={{ color: MAIN_COLOUR }}
        >
          <SettingsIcon />
        </IconButton>

        <Menu
          disableScrollLock={true}
          anchorEl={anchorEl}
          open={open}
          onClose={handleMenuClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <MenuItem onClick={() => setShowGroupDragHandles && setShowGroupDragHandles(prev => !prev)}>
            <Checkbox checked={showGroupDragHandles} size="small" sx={{ p: 0, mr: 1.5 }} />
            <ListItemText primary="Show Group Drag Handles" />
          </MenuItem>
          <MenuItem onClick={() => setShowTaskDragHandles && setShowTaskDragHandles(prev => !prev)}>
            <Checkbox checked={showTaskDragHandles} size="small" sx={{ p: 0, mr: 1.5 }} />
            <ListItemText primary="Show Task Drag Handles" />
          </MenuItem>
        </Menu>
      </Box>
    </div>
  );
}

export default GlobalTasksTopbar;