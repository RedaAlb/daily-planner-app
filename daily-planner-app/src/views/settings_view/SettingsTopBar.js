import React from "react";

import { SETTINGS_TOPBAR_BG } from "../../utils/constants";

import TopBar from "../../components/TopBar";
import { Typography } from "@mui/material";


function SettingsTopBar(props) {
  return (
    <TopBar bgColour={SETTINGS_TOPBAR_BG}>
      <TopBar.LeftSide>
        <Typography color="black" variant="h6" noWrap component="div">Settings</Typography>
      </TopBar.LeftSide>

      <TopBar.RightSide>
      </TopBar.RightSide>
    </TopBar>
  )
}

export default SettingsTopBar;