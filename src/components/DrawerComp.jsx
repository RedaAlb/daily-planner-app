import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { IconButton, Stack } from "@mui/material";
import { Drawer, Typography } from "@mui/material";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import Divider from "@mui/material/Divider";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import TodayIcon from '@mui/icons-material/Today';
import MenuIcon from '@mui/icons-material/Menu';
import ArchiveIcon from "@mui/icons-material/Archive";
import SettingsIcon from '@mui/icons-material/Settings';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import LoginIcon from "@mui/icons-material/Login";
import LogoutIcon from "@mui/icons-material/Logout";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";

import { ARCHIVED_TASKS_VIEW_PATH, GLOBAL_TASKS_VIEW_PATH, GYM_WEIGHTS_VIEW_PATH, SETTINGS_VIEW_PATH } from "../utils/constants";
import { useAuth } from "../context/AuthContext";


function DrawerComp(props) {
  const navigate = useNavigate();
  const { user, isAuthorized, login, logout } = useAuth();

  const [drawerState, setDrawerState] = useState(false);


  const onDailyPlannerClick = () => {
    navigate("/");
  }


  const onGlobalClick = () => {
    navigate(GLOBAL_TASKS_VIEW_PATH);
  }

  const onGymWeightsClick = () => {
    navigate(GYM_WEIGHTS_VIEW_PATH);
  }

  const onArchivedTasksClick = () => {
    navigate(ARCHIVED_TASKS_VIEW_PATH)
  }


  const onSettingsClick = () => {
    navigate(SETTINGS_VIEW_PATH);
  }


  return (
    <>
      <Stack direction="row">
        <IconButton size="large" onClick={() => setDrawerState(true)}>
          <MenuIcon />
        </IconButton>
      </Stack>

      <Drawer anchor={"left"} open={drawerState} onClose={() => setDrawerState(false)}>
        <Box sx={{ width: 260, display: "flex", flexDirection: "column", height: "100%" }} role="presentation">
          <List sx={{ flexGrow: 1 }}>
            <ListItem>
              <Typography variant="h6" noWrap component="div">Main</Typography>
            </ListItem>

            <ListItem disablePadding>
              <ListItemButton onClick={onDailyPlannerClick}>
                <ListItemIcon> <TodayIcon /> </ListItemIcon>
                <ListItemText primary="Daily Planner" />
              </ListItemButton>
            </ListItem>

            <ListItem disablePadding>
              <ListItemButton onClick={onGlobalClick}>
                <ListItemIcon> <CheckBoxIcon /> </ListItemIcon>
                <ListItemText primary="Global Tasks" />
              </ListItemButton>
            </ListItem>

            <ListItem disablePadding>
              <ListItemButton onClick={onGymWeightsClick}>
                <ListItemIcon> <FitnessCenterIcon /> </ListItemIcon>
                <ListItemText primary="Gym Weights" />
              </ListItemButton>
            </ListItem>

            <ListItem disablePadding>
              <ListItemButton onClick={onArchivedTasksClick}>
                <ListItemIcon> <ArchiveIcon /> </ListItemIcon>
                <ListItemText primary="Archived Tasks" />
              </ListItemButton>
            </ListItem>

            <Divider />

            <ListItem>
              <Typography variant="h6" noWrap component="div">App</Typography>
            </ListItem>

            <ListItem disablePadding>
              <ListItemButton onClick={onSettingsClick}>
                <ListItemIcon> <SettingsIcon /> </ListItemIcon>
                <ListItemText primary="Settings" />
              </ListItemButton>
            </ListItem>
            <Divider />
          </List>

          {/* Account & Auth Section */}
          <Box sx={{ p: 2, borderTop: 1, borderColor: "divider", bgcolor: "background.paper" }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              Account & Sync
            </Typography>

            {user ? (
              <Stack spacing={1}>
                <Stack direction="row" spacing={1} alignItems="center">
                  {user.photoURL ? (
                    <Avatar src={user.photoURL} sx={{ width: 32, height: 32 }} />
                  ) : (
                    <AccountCircleIcon />
                  )}
                  <Box sx={{ overflow: "hidden" }}>
                    <Typography variant="body2" noWrap fontWeight="medium">
                      {user.displayName || "Google User"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap display="block">
                      {user.email}
                    </Typography>
                  </Box>
                </Stack>

                <Chip
                  label={isAuthorized ? "Cloud Synced (Firebase)" : "Unauthorized (Demo Mode)"}
                  color={isAuthorized ? "success" : "warning"}
                  size="small"
                  variant="outlined"
                />

                <ListItem disablePadding sx={{ mt: 1 }}>
                  <ListItemButton onClick={logout} sx={{ borderRadius: 1 }}>
                    <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Sign Out" primaryTypographyProps={{ variant: "body2" }} />
                  </ListItemButton>
                </ListItem>
              </Stack>
            ) : (
              <Stack spacing={1}>
                <Chip label="Demo Mode (Local Storage)" color="default" size="small" variant="outlined" />
                <ListItem disablePadding>
                  <ListItemButton onClick={login} sx={{ borderRadius: 1, bgcolor: "action.selected" }}>
                    <ListItemIcon><LoginIcon color="primary" fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Sign in with Google" primaryTypographyProps={{ variant: "body2", fontWeight: "bold" }} />
                  </ListItemButton>
                </ListItem>
              </Stack>
            )}
          </Box>
        </Box>
      </Drawer>
    </>
  )
}

export default DrawerComp;