import React, { useState } from "react";

import { IconButton, Stack } from "@mui/material";
import { Drawer, Typography } from "@mui/material";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import Divider from "@mui/material/Divider";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import NoteIcon from '@mui/icons-material/Note';
import MenuIcon from '@mui/icons-material/Menu';


function DrawerComp(props) {
  const [drawerState, setDrawerState] = useState(false);


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
              <Typography variant="h6" noWrap component="div">Placeholder</Typography>
            </ListItem>

            <ListItem button>
              <ListItemIcon> <NoteIcon /> </ListItemIcon>
              <ListItemText primary="Placeholder" />
            </ListItem>
          </List>

          <Divider />
        </Box>
      </Drawer>
    </>
  )
}

export default DrawerComp;