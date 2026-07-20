import React, { useState } from "react";
import {
  List,
  ListItem,
  IconButton,
  Box,
  ListItemIcon,
  Typography,
  Checkbox,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import UnarchiveIcon from "@mui/icons-material/Unarchive";
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';

import {
  DEFAULT_HORI_GAP,
  MAIN_COLOUR,
  MAIN_LINE_HEIGHT,
  SECONDARY_FONT_SIZE,
  TASK_ITEM_MIN_HEIGHT
} from "../utils/constants";
import useGlobalTasks from "../hooks/useGlobalTasks";
import DeleteDialog from "./ui/DeleteDialog";

const ArchivedList = () => {
  const { archivedItems, unarchiveItem, deleteArchivedItem } = useGlobalTasks();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDeleteIndex, setItemToDeleteIndex] = useState(null);

  const openDeleteDialog = (index) => {
    setItemToDeleteIndex(index);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setItemToDeleteIndex(null);
  };

  const confirmDelete = async () => {
    if (itemToDeleteIndex !== null) {
      await deleteArchivedItem(itemToDeleteIndex);
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

      <DeleteDialog
        open={deleteDialogOpen}
        onClose={closeDeleteDialog}
        onConfirm={confirmDelete}
        itemText={itemToDeleteIndex !== null && archivedItems[itemToDeleteIndex] ? archivedItems[itemToDeleteIndex].text : ""}
        textPrefix="Delete archived task:"
      />
    </Box>
  );
};

export default ArchivedList;