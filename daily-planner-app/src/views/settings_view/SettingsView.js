import React, { useState } from "react";

import LocationOnIcon from '@mui/icons-material/LocationOn';
import DownloadIcon from '@mui/icons-material/Download';
import SaveIcon from '@mui/icons-material/Save';
import FolderDeleteIcon from '@mui/icons-material/FolderDelete';
import WarningIcon from '@mui/icons-material/Warning';

import { DATE_SAVE_LOCATION, EXPORTS_DIR_NAME } from "../../utils/constants";

import ConfirmDialog from '../../components/ConfirmDialog';
import SnackbarComp from '../../components/SnackbarComp';

import SettingsItem from "./SettingsItem";
import SettingsTopBar from "./SettingsTopBar";
import SettingsTextDivider from "./SettingsTextDivider";


function SettingsView(props) {
  const [exportSnackbar, setExportSnackbar] = useState(false);
  const [importSnackbar, setImportSnackbar] = useState(false);
  const [delDataSnackbar, setDelDataSnackbar] = useState(false);
  const [deleteAllDataDiaOpen, setDeleteAllDataDiaOpen] = useState(false);  // Dia: Dialog


  const onExportClick = () => {
  }


  const onImportClick = () => {
  }


  const onDelAllDataConfirmed = () => {
    setDeleteAllDataDiaOpen(false);
    setDelDataSnackbar(true);
  }


  return (
    <>
      <SettingsTopBar />

      <SettingsTextDivider text="Location" />
      <SettingsItem text="Save date creation location" icon={<LocationOnIcon />} saveKey={DATE_SAVE_LOCATION} switch />

      <SettingsTextDivider text="Data" />
      <SettingsItem text="Export" icon={<SaveIcon />} onClick={onExportClick} />
      <SettingsItem text="Import" icon={<DownloadIcon />} onClick={onImportClick} />
      <SettingsItem text="Delete all data" icon={<FolderDeleteIcon />} onClick={() => setDeleteAllDataDiaOpen(true)} />

      <ConfirmDialog
        dialogOpen={deleteAllDataDiaOpen}
        setDialogOpen={setDeleteAllDataDiaOpen}
        diaTitle="Delete ALL data?"
        diaText="All data in the app will be deleted."
        diaIcon={<WarningIcon sx={{ color: "#ff0000" }} />}
        onConfirmed={onDelAllDataConfirmed}
      />

      <SnackbarComp text={`Exported successfully to /Documents/${EXPORTS_DIR_NAME}`} open={exportSnackbar} setOpen={setExportSnackbar} />
      <SnackbarComp text="Imported successfully" open={importSnackbar} setOpen={setImportSnackbar} />
      <SnackbarComp text="All data deleted successfully" open={delDataSnackbar} setOpen={setDelDataSnackbar} />
    </>
  )
}

export default SettingsView;