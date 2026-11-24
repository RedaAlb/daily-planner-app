import React, { useState } from "react";

import LocationOnIcon from '@mui/icons-material/LocationOn';
import DownloadIcon from '@mui/icons-material/Download';
import SaveIcon from '@mui/icons-material/Save';
import FolderDeleteIcon from '@mui/icons-material/FolderDelete';
import WarningIcon from '@mui/icons-material/Warning';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SystemUpdateAltIcon from '@mui/icons-material/SystemUpdateAlt';

import { deleteDb, exportDb, importDb } from "../../utils/Firebase";
import { DATE_SAVE_LOCATION } from "../../utils/constants";
import { checkForAppUpdate, getVersionSummary } from "../../utils/appVersion";

import ConfirmDialog from '../../components/ConfirmDialog';
import SnackbarComp from '../../components/SnackbarComp';

import SettingsItem from "./SettingsItem";
import SettingsTopBar from "./SettingsTopBar";
import SettingsTextDivider from "./SettingsTextDivider";


function SettingsView(props) {
  const [exportSnackbar, setExportSnackbar] = useState(false);
  const [importSnackbar, setImportSnackbar] = useState(false);
  const [delDataSnackbar, setDelDataSnackbar] = useState(false);
  const [statusSnackbar, setStatusSnackbar] = useState({ open: false, text: "", severity: "info" });
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [importDataDiaOpen, setImportDataDiaOpen] = useState(false);
  const [deleteAllDataDiaOpen, setDeleteAllDataDiaOpen] = useState(false);  // Dia: Dialog

  const versionSummary = getVersionSummary();

  const showStatus = (text, severity = "info") => {
    setStatusSnackbar({ open: true, text, severity });
  };

  const showError = (text) => {
    showStatus(text, "error");
  };

  const onExportClick = () => {
    exportDb(setExportSnackbar, showError);
  }


  const onImportClick = () => {
    setImportDataDiaOpen(true);
  }

  const onImportConfirmed = () => {
    setImportDataDiaOpen(false);
    importDb(setImportSnackbar, showError);
  }


  const onDelAllDataConfirmed = async () => {
    setDeleteAllDataDiaOpen(false);
    const deleted = await deleteDb();
    if (deleted) {
      setDelDataSnackbar(true);
    } else {
      showError("Delete failed. Make sure you are signed in and online.");
    }
  }

  const onCopyVersionClick = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(versionSummary);
        showStatus("Version copied to clipboard", "success");
      }
    } catch {
      // Clipboard access denied or unsupported
    }
  };

  const onCheckUpdateClick = async () => {
    setCheckingUpdate(true);
    const result = await checkForAppUpdate();
    setCheckingUpdate(false);

    if (result === "updated") {
      showStatus("Update found! Reloading...", "success");
    } else if (result === "up-to-date") {
      showStatus("You're on the latest version", "success");
    } else if (result === "unsupported") {
      showStatus("No service worker active — refresh to load latest", "info");
    } else {
      showError("Could not check for updates. Make sure you're online.");
    }
  };


  return (
    <>
      <SettingsTopBar />

      <SettingsTextDivider text="Location" />
      <SettingsItem text="Save date creation location" icon={<LocationOnIcon />} saveKey={DATE_SAVE_LOCATION} switch />

      <SettingsTextDivider text="Data" />
      <SettingsItem text="Export" icon={<SaveIcon />} onClick={onExportClick} />
      <SettingsItem text="Import" icon={<DownloadIcon />} onClick={onImportClick} />
      <SettingsItem text="Delete all data" icon={<FolderDeleteIcon />} onClick={() => setDeleteAllDataDiaOpen(true)} />

      <SettingsTextDivider text="About" />
      <SettingsItem
        text="Version"
        secondaryText={versionSummary}
        icon={<InfoOutlinedIcon />}
        onClick={onCopyVersionClick}
      />
      <SettingsItem
        text="Check for update"
        secondaryText={checkingUpdate ? "Checking..." : "Check for a newer deployed version"}
        icon={<SystemUpdateAltIcon />}
        onClick={onCheckUpdateClick}
        disabled={checkingUpdate}
      />

      <ConfirmDialog
        dialogOpen={importDataDiaOpen}
        setDialogOpen={setImportDataDiaOpen}
        diaTitle="Import data?"
        diaText="Importing a backup will overwrite all existing data in the app."
        diaIcon={<WarningIcon sx={{ color: "#ed6c02" }} />}
        onConfirmed={onImportConfirmed}
      />

      <ConfirmDialog
        dialogOpen={deleteAllDataDiaOpen}
        setDialogOpen={setDeleteAllDataDiaOpen}
        diaTitle="Delete ALL data?"
        diaText="All data in the app will be deleted."
        diaIcon={<WarningIcon sx={{ color: "#ff0000" }} />}
        onConfirmed={onDelAllDataConfirmed}
      />

      <SnackbarComp text="Exported database successfully" open={exportSnackbar} setOpen={setExportSnackbar} />
      <SnackbarComp text="Imported successfully" open={importSnackbar} setOpen={setImportSnackbar} />
      <SnackbarComp text="All data deleted successfully" open={delDataSnackbar} setOpen={setDelDataSnackbar} />
      <SnackbarComp
        text={statusSnackbar.text}
        severity={statusSnackbar.severity}
        open={statusSnackbar.open}
        setOpen={(open) => setStatusSnackbar((prev) => ({ ...prev, open }))}
      />
    </>
  )
}

export default SettingsView;