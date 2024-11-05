import React, { useState, useEffect } from "react";
import {
  List,
  ListItem,
  IconButton,
  Box,
  ListItemIcon,
  Typography,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import UnarchiveIcon from "@mui/icons-material/Unarchive";
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import {
  ref,
  remove,
  onValue,
  off,
  update,
  get
} from 'firebase/database';
import {
  DEFAULT_HORI_GAP,
  MAIN_COLOUR,
  MAIN_LINE_HEIGHT,
  SECONDARY_FONT_SIZE,
  TASK_ITEM_MIN_HEIGHT
} from "../utils/constants";
import { appDb } from "../utils/Firebase";

const ArchivedList = () => {
  const [archivedItems, setArchivedItems] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  useEffect(() => {
    const archivedTasksRef = ref(appDb, 'archived_global_tasks');

    const archivedListener = onValue(archivedTasksRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const archivedArray = Object.entries(data).map(([id, value]) => ({
          id,
          ...value
        })).sort((a, b) => (b.archivedAt || 0) - (a.archivedAt || 0));
        setArchivedItems(archivedArray);
      } else {
        setArchivedItems([]);
      }
    });

    return () => {
      off(archivedTasksRef, 'value', archivedListener);
    };
  }, []);

  const unarchiveItem = async (index) => {
    const itemToUnarchive = archivedItems[index];

    // Get the current highest order from global tasks
    const globalTasksRef = ref(appDb, 'global_tasks');
    const snapshot = await get(globalTasksRef);
    const currentTasks = snapshot.val() || {};
    const currentOrders = Object.values(currentTasks).map(task => task.order);
    const nextOrder = currentOrders.length > 0 ? Math.max(...currentOrders) + 1 : 0;

    const updates = {};

    // Add to global tasks with new order
    const restoredTask = {
      ...itemToUnarchive,
      order: nextOrder,
      archivedAt: null // Remove the archivedAt timestamp
    };
    delete restoredTask.archivedAt; // Ensure archivedAt is removed

    updates[`global_tasks/${itemToUnarchive.id}`] = restoredTask;
    updates[`archived_global_tasks/${itemToUnarchive.id}`] = null; // Remove from archived

    await update(ref(appDb), updates);
  };

  const openDeleteDialog = (index) => {
    setItemToDelete({ index, ...archivedItems[index] });
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const confirmDelete = async () => {
    if (itemToDelete) {
      await remove(ref(appDb, `archived_global_tasks/${itemToDelete.id}`));
    }
    closeDeleteDialog();
  };

  const notCheckedIcon = <CheckBoxOutlineBlankIcon fontSize="inherit" sx={{ color: MAIN_COLOUR }} />;
  const checkedIcon = <CheckBoxIcon fontSize="inherit" sx={{ color: MAIN_COLOUR }} />;

  return (
    <Box>
      <List>
        {archivedItems.map((item, index) => (
          <ListItem key={item.id} sx={{ display: "flex", alignItems: "center", padding: 0, background: "white" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                borderBottom: `${MAIN_LINE_HEIGHT} solid ${MAIN_COLOUR}`,
                minHeight: TASK_ITEM_MIN_HEIGHT,
                width: "-webkit-fill-available",
                paddingLeft: "10px",
                paddingRight: DEFAULT_HORI_GAP,
                opacity: 1
              }}
            >
              <ListItemIcon sx={{ minWidth: "auto", paddingRight: "5px" }}>
                <Checkbox
                  checked={item.checked}
                  disabled
                  icon={notCheckedIcon}
                  checkedIcon={checkedIcon}
                  sx={{ padding: 0, fontSize: "30px", opacity: 0.8 }}
                />
              </ListItemIcon>

              <Typography
                sx={{
                  flex: 1,
                  overflow: "hidden",
                  fontSize: SECONDARY_FONT_SIZE,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  opacity: 0.8
                }}
              >
                {item.text}
              </Typography>

              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", }}>
                <IconButton edge="end" onClick={() => unarchiveItem(index)} sx={{ marginLeft: "10px" }} title="Restore task">
                  <UnarchiveIcon />
                </IconButton>
                <IconButton edge="end" onClick={() => openDeleteDialog(index)} sx={{ marginLeft: "10px" }} title="Delete">
                  <DeleteIcon />
                </IconButton>
              </Box>
            </div>
          </ListItem>
        ))}
      </List>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={closeDeleteDialog}>
        <DialogTitle id="delete-dialog-title">
          Confirm deletion
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Delete archived task: {itemToDelete?.text}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={confirmDelete} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ArchivedList;