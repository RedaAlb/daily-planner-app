import React, { useContext, useState } from "react";

import { IconButton, Stack } from "@mui/material";
import { Drawer, Typography } from "@mui/material";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import Divider from "@mui/material/Divider";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import DeleteIcon from '@mui/icons-material/Delete';
import MenuIcon from '@mui/icons-material/Menu';

import dailyplannerContext from "../views/dailyplanner_view/context/dailyplanner-context";

import { deleteDateData, getDbDateKey } from "../utils/Firebase";

import ConfirmDialog from './ConfirmDialog';


function DrawerComp(props) {
  const { state } = useContext(dailyplannerContext);

  const [drawerState, setDrawerState] = useState(false);
  const [deleteDateDialog, setDeleteDateDialog] = useState(false);


  const onDeleteDateConfirm = () => {
    deleteDateData(state.currentDate);
    window.location.reload();
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
              <Typography variant="h6" noWrap component="div">Actions</Typography>
            </ListItem>

            <ListItem button onClick={() => setDeleteDateDialog(true)}>
              <ListItemIcon> <DeleteIcon /> </ListItemIcon>
              <ListItemText primary="Delete date" />
            </ListItem>

            <ConfirmDialog
              dialogOpen={deleteDateDialog}
              setDialogOpen={setDeleteDateDialog}
              diaTitle="Delete date?"
              diaText={`All (${getDbDateKey(state.currentDate, "/")}) data will be deleted.`}
              onConfirmed={onDeleteDateConfirm}
            />
          </List>

          <Divider />
        </Box>
      </Drawer>
    </>
  )
}

export default DrawerComp;