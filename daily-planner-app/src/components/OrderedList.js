import React, { useState, useEffect, memo, useCallback } from "react";
import {
  List,
  ListItem,
  IconButton,
  Box,
  ListItemIcon,
  Checkbox,
  Fab
} from "@mui/material";
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArchiveIcon from "@mui/icons-material/Archive";
import DeleteIcon from "@mui/icons-material/Delete";
import DragHandleIcon from "@mui/icons-material/DragHandle";
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import AddIcon from '@mui/icons-material/Add';

import {
  DEFAULT_HORI_GAP,
  MAIN_COLOUR,
  MAIN_LINE_HEIGHT,
  SECONDARY_FONT_SIZE,
  TASK_ITEM_MIN_HEIGHT
} from "../utils/constants";

import useDebounce from "../hooks/useDebounce";
import useGlobalTasks from "../hooks/useGlobalTasks";
import DeleteDialog from "./ui/DeleteDialog";
import DebouncedTextArea from "./ui/DebouncedTextArea";


// Memoized list item component with local state management
const ListItemComponent = memo(({
  item,
  index,
  provided,
  onToggleCheckbox,
  onTextChange,
  onMoveToTop,
  onMoveToBottom,
  onArchive,
  onDelete
}) => {
  const [localChecked, setLocalChecked] = useState(item.checked);

  useEffect(() => {
    setLocalChecked(item.checked);
  }, [item.checked]);

  const handleTextChange = useCallback((value) => {
    onTextChange(index, value);
  }, [index, onTextChange]);

  const debouncedToggleCheckbox = useDebounce((checked) => {
    onToggleCheckbox(index, checked);
  }, 300);

  const handleCheckboxToggle = useCallback(() => {
    const newChecked = !localChecked;
    setLocalChecked(newChecked);
    debouncedToggleCheckbox(newChecked);
  }, [localChecked, debouncedToggleCheckbox]);

  const notCheckedIcon = <CheckBoxOutlineBlankIcon fontSize="inherit" sx={{ color: MAIN_COLOUR }} />;
  const checkedIcon = <CheckBoxIcon fontSize="inherit" sx={{ color: MAIN_COLOUR }} />;

  return (
    <ListItem
      ref={provided.innerRef}
      {...provided.draggableProps}
      sx={{ display: "flex", alignItems: "center", padding: 0, background: "white" }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          borderBottom: `${MAIN_LINE_HEIGHT} solid ${MAIN_COLOUR}`,
          minHeight: TASK_ITEM_MIN_HEIGHT,
          width: "-webkit-fill-available",
          paddingLeft: "10px",
          paddingRight: DEFAULT_HORI_GAP,
        }}
      >
        <ListItemIcon
          {...provided.dragHandleProps}
          sx={{ cursor: "grab", minWidth: "auto", paddingRight: "5px" }}
        >
          <DragHandleIcon />
        </ListItemIcon>

        <Checkbox
          checked={localChecked}
          onClick={handleCheckboxToggle}
          icon={notCheckedIcon}
          checkedIcon={checkedIcon}
          sx={{ padding: 0, fontSize: "30px" }}
        />

        <DebouncedTextArea
          value={item.text}
          onChange={handleTextChange}
          style={{
            width: "100%",
            overflow: "hidden",
            fontSize: SECONDARY_FONT_SIZE
          }}
        />

        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
          <IconButton edge="end" onClick={() => onMoveToTop(index)} title="Move to top">
            <ArrowUpwardIcon />
          </IconButton>
          <IconButton edge="end" onClick={() => onMoveToBottom(index)} title="Move to bottom">
            <ArrowDownwardIcon />
          </IconButton>
          <IconButton edge="end" onClick={() => onArchive(index)} sx={{ marginLeft: "10px" }} title="Archive">
            <ArchiveIcon />
          </IconButton>
          <IconButton edge="end" onClick={() => onDelete(index)} sx={{ marginLeft: "10px" }} title="Delete">
            <DeleteIcon />
          </IconButton>
        </Box>
      </div>
    </ListItem>
  );
});

const OrderedList = () => {
  const {
    items,
    handleDragEnd,
    moveToTop,
    moveToBottom,
    onAddTask,
    toggleCheckbox,
    handleTextChange,
    archiveItem,
    confirmDelete
  } = useGlobalTasks();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDeleteIndex, setItemToDeleteIndex] = useState(null);

  const openDeleteDialog = useCallback((index) => {
    setItemToDeleteIndex(index);
    setDeleteDialogOpen(true);
  }, []);

  const closeDeleteDialog = useCallback(() => {
    setDeleteDialogOpen(false);
    setItemToDeleteIndex(null);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (itemToDeleteIndex !== null) {
      await confirmDelete(itemToDeleteIndex);
    }
    closeDeleteDialog();
  }, [itemToDeleteIndex, confirmDelete, closeDeleteDialog]);

  return (
    <Box>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="droppable-list">
          {(provided) => (
            <List {...provided.droppableProps} ref={provided.innerRef}>
              {items.map((item, index) => (
                <Draggable key={item.id} draggableId={item.id} index={index}>
                  {(provided) => (
                    <ListItemComponent
                      item={item}
                      index={index}
                      provided={provided}
                      onToggleCheckbox={toggleCheckbox}
                      onTextChange={handleTextChange}
                      onMoveToTop={moveToTop}
                      onMoveToBottom={moveToBottom}
                      onArchive={archiveItem}
                      onDelete={openDeleteDialog}
                    />
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </List>
          )}
        </Droppable>
      </DragDropContext>

      <Fab
        onClick={onAddTask}
        color="primary"
        size="large"
        sx={{ position: "fixed", bottom: 26, right: 26 }}
      >
        <AddIcon fontSize="medium" />
      </Fab>

      <DeleteDialog
        open={deleteDialogOpen}
        onClose={closeDeleteDialog}
        onConfirm={handleConfirmDelete}
        itemText={itemToDeleteIndex !== null && items[itemToDeleteIndex] ? items[itemToDeleteIndex].text : ""}
        textPrefix="Delete task:"
      />
    </Box>
  );
};

export default OrderedList;