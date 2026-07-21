import React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';


function ConfirmDialog(props) {

  const onDialogClose = () => {
    props.setDialogOpen(false);
  }


  return (
    <Dialog
      open={props.dialogOpen}
      onClose={onDialogClose}
    >
      <DialogTitle>
        {props.diaTitle}
      </DialogTitle>

      <DialogContent>
        {props.diaIcon ? props.diaIcon : null}
        <DialogContentText>{props.diaText}</DialogContentText>
      </DialogContent>

      <DialogActions>
        <Button onClick={props.onConfirmed}>Yes</Button>
        <Button onClick={onDialogClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  )
}

export default ConfirmDialog;