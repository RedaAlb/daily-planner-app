import React, { useState } from "react";

import LocationOnIcon from '@mui/icons-material/LocationOn';
import DownloadIcon from '@mui/icons-material/Download';
import SaveIcon from '@mui/icons-material/Save';

import { exportDb, importDb } from "../../utils/Firebase";
import { DATE_SAVE_LOCATION, EXPORTS_DIR_NAME } from "../../utils/constants";

import SnackbarComp from '../../components/SnackbarComp';
import SettingsItem from "./SettingsItem";
import SettingsTopBar from "./SettingsTopBar";
import SettingsTextDivider from "./SettingsTextDivider";


function SettingsView(props) {
  const [exportSnackbar, setExportSnackbar] = useState(false);
  const [importSnackbar, setImportSnackbar] = useState(false);


  const onExportClick = () => {
    exportDb(setExportSnackbar);
  }


  const onImportClick = () => {
    importDb(setImportSnackbar);
  }


  return (
    <>
      <SettingsTopBar />

      <SettingsTextDivider text="Location" />
      <SettingsItem text="Save date creation location" icon={<LocationOnIcon />} saveKey={DATE_SAVE_LOCATION} switch />

      <SettingsTextDivider text="Data" />
      <SettingsItem text="Export" icon={<SaveIcon />} onClick={onExportClick} />
      <SettingsItem text="Import" icon={<DownloadIcon />} onClick={onImportClick} />

      <SnackbarComp text={`Exported successfully to /Documents/${EXPORTS_DIR_NAME}`} open={exportSnackbar} setOpen={setExportSnackbar} />
      <SnackbarComp text="Imported successfully" open={importSnackbar} setOpen={setImportSnackbar} />
    </>
  )
}

export default SettingsView;