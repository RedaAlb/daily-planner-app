import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { IconButton, Stack } from "@mui/material";
import { Drawer, Typography } from "@mui/material";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import Divider from "@mui/material/Divider";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import TodayIcon from '@mui/icons-material/Today';
import MenuIcon from '@mui/icons-material/Menu';
import SettingsIcon from '@mui/icons-material/Settings';

import { SETTINGS_VIEW_PATH } from "../utils/constants";


function DrawerComp(props) {
  const navigate = useNavigate();

  const [drawerState, setDrawerState] = useState(false);


  const onDailyPlannerClick = () => {
    navigate("/");
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
        <Box sx={{ width: "left" === "top" || "left" === "bottom" ? "auto" : 250 }} role="presentation">
          <List>
            <ListItem>
              <Typography variant="h6" noWrap component="div">Main</Typography>
            </ListItem>

            <ListItem button onClick={onDailyPlannerClick}>
              <ListItemIcon> <TodayIcon /> </ListItemIcon>
              <ListItemText primary="Daily Planner" />
            </ListItem>

            <Divider />

            <ListItem>
              <Typography variant="h6" noWrap component="div">App</Typography>
            </ListItem>

            <ListItem button onClick={onSettingsClick}>
              <ListItemIcon> <SettingsIcon /> </ListItemIcon>
              <ListItemText primary="Settings" />
            </ListItem>
            <Divider />
          </List>
        </Box>
      </Drawer>
    </>
  )
}

export default DrawerComp;