import React, { memo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";

const DeleteDialog = memo(({ open, onClose, onConfirm, itemText, title="Confirm deletion", textPrefix="Delete item:" }) => (
  <Dialog open={open} onClose={onClose}>
    <DialogTitle>{title}</DialogTitle>
    <DialogContent>
      <DialogContentText>
        {textPrefix} {itemText}
      </DialogContentText>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} color="primary">
        Cancel
      </Button>
      <Button onClick={onConfirm} autoFocus color="error">
        Delete
      </Button>
    </DialogActions>
  </Dialog>
));

export default DeleteDialog;
