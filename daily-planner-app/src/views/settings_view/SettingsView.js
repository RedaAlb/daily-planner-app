import React from "react";

import LocationOnIcon from '@mui/icons-material/LocationOn';

import SettingsItem from "./SettingsItem";
import SettingsTopBar from "./SettingsTopBar";
import SettingsTextDivider from "./SettingsTextDivider";
import { DATE_SAVE_LOCATION } from "../../utils/constants";


function SettingsView(props) {
  return (
    <>
      <SettingsTopBar />

      <SettingsTextDivider text="Location" />
      <SettingsItem text="Save date creation location" icon={<LocationOnIcon />} saveKey={DATE_SAVE_LOCATION} switch />
    </>
  )
}

export default SettingsView;