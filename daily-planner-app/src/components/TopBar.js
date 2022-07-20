import React from "react";

import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import { Stack } from '@mui/material';

import DrawerComp from "./DrawerComp";


function TopBar(props) {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" style={{ background: props.bgColour }}>
        <Toolbar disableGutters={true}>
          <DrawerComp />

          <LeftSide> {props.children[0]} </LeftSide>

          <Box sx={{ flexGrow: 1 }} />

          <RightSide> {props.children[1]} </RightSide>
        </Toolbar>
      </AppBar>
    </Box>
  )
}


function LeftSide(props) {
  return (
    <>
      {props.children}
    </>
  )
}


function RightSide(props) {
  return (
    <Stack direction="row" spacing={1} alignItems={"center"}>
      {props.children}
    </Stack>
  )
}


TopBar.LeftSide = LeftSide;
TopBar.RightSide = RightSide;

export default TopBar;