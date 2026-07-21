import React from "react";

import { Alert, Snackbar } from '@mui/material';


function SnackbarComp(props) {

  const handleClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }

    props.setOpen(false);
  }


  return (
    <Snackbar
      open={props.open}
      autoHideDuration={3000}
      onClose={handleClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
    >
      <Alert onClose={handleClose} severity={"success"} sx={{ width: "100%" }}>
        {props.text}
      </Alert>
    </Snackbar>
  )
}

export default SnackbarComp;