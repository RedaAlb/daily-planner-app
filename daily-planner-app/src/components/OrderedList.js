import React, { useState, useEffect, memo, useCallback, useRef } from "react";
import {
  List,
  ListItem,
  IconButton,
  Box,
  ListItemIcon,
  TextareaAutosize,
  Checkbox,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
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
  ref,
  set,
  remove,
  onValue,
  off,
  update
} from 'firebase/database';
import {
  DEFAULT_HORI_GAP,
  MAIN_COLOUR,
  MAIN_LINE_HEIGHT,
  SECONDARY_FONT_SIZE,
  TASK_ITEM_MIN_HEIGHT
} from "../utils/constants";
import { appDb } from "../utils/Firebase";

// Custom debounce hook
const useDebounce = (callback, delay) => {
  const timeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const debouncedCallback = useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);

  return debouncedCallback;
};

// Memoized delete confirmation dialog component
const DeleteDialog = memo(({ open, onClose, onConfirm, itemText }) => (
  <Dialog open={open} onClose={onClose}>
    <DialogTitle>Confirm deletion</DialogTitle>
    <DialogContent>
      <DialogContentText>
        Delete task: {itemText}
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

// Debounced TextArea component
const DebouncedTextArea = memo(({ value, onChange, style }) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const debouncedOnChange = useDebounce(onChange, 300);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    debouncedOnChange(newValue);
  };

  return (
    <TextareaAutosize
      value={localValue}
      onChange={handleChange}
      style={style}
    />
  );
});

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
  const [items, setItems] = useState([]);
  // eslint-disable-next-line
  const [archivedItems, setArchivedItems] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  useEffect(() => {
    const tasksRef = ref(appDb, 'global_tasks');
    const archivedTasksRef = ref(appDb, 'archived_global_tasks');

    const tasksListener = onValue(tasksRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const taskArray = Object.entries(data)
          .map(([id, value]) => ({
            id,
            ...value
          }))
          .sort((a, b) => a.order - b.order);
        setItems(taskArray);
      } else {
        setItems([]);
      }
    });

    const archivedListener = onValue(archivedTasksRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const archivedArray = Object.entries(data)
          .map(([id, value]) => ({
            id,
            ...value
          }))
          .sort((a, b) => (b.archivedAt || 0) - (a.archivedAt || 0));
        setArchivedItems(archivedArray);
      } else {
        setArchivedItems([]);
      }
    });

    return () => {
      off(tasksRef, 'value', tasksListener);
      off(archivedTasksRef, 'value', archivedListener);
    };
  }, []);

  const updateItemsInDatabase = useCallback(async (updatedItems) => {
    const updates = {};
    updatedItems.forEach((item, index) => {
      updates[`global_tasks/${item.id}`] = {
        ...item,
        order: index
      };
    });
    await update(ref(appDb), updates);
  }, []);

  const handleDragEnd = useCallback(async (result) => {
    if (!result.destination) return;

    const newItems = Array.from(items);
    const [movedItem] = newItems.splice(result.source.index, 1);
    newItems.splice(result.destination.index, 0, movedItem);

    await updateItemsInDatabase(newItems);
  }, [items, updateItemsInDatabase]);

  const moveToTop = useCallback(async (index) => {
    const newItems = [...items];
    const [movedItem] = newItems.splice(index, 1);
    newItems.unshift(movedItem);

    await updateItemsInDatabase(newItems);
  }, [items, updateItemsInDatabase]);

  const moveToBottom = useCallback(async (index) => {
    const newItems = [...items];
    const [movedItem] = newItems.splice(index, 1);

    const uncheckedItems = newItems.filter(item => !item.checked);
    const checkedItems = newItems.filter(item => item.checked);
    checkedItems.unshift(movedItem);

    const updatedItems = [...uncheckedItems, ...checkedItems];
    await updateItemsInDatabase(updatedItems);
  }, [items, updateItemsInDatabase]);

  const onAddTask = useCallback(async () => {
    const newItemId = `${Date.now()}`;
    const newItem = {
      id: newItemId,
      text: "",
      checked: false,
      order: 0,
      createdAt: Date.now()
    };

    const updatedItems = [newItem, ...items.map(item => ({ ...item, order: item.order + 1 }))];
    await updateItemsInDatabase(updatedItems);
  }, [items, updateItemsInDatabase]);

  const toggleCheckbox = useCallback(async (index, checked) => {
    const updatedItem = {
      ...items[index],
      checked: checked,
      checkedAt: Date.now()
    };

    await set(ref(appDb, `global_tasks/${items[index].id}`), updatedItem);
  }, [items]);

  const handleTextChange = useCallback(async (index, value) => {
    const updatedItem = {
      ...items[index],
      text: value
    };

    await set(ref(appDb, `global_tasks/${items[index].id}`), updatedItem);
  }, [items]);

  const archiveItem = useCallback(async (index) => {
    const itemToArchive = items[index];
    const archivedItem = {
      ...itemToArchive,
      archivedAt: Date.now()
    };

    await set(ref(appDb, `archived_global_tasks/${itemToArchive.id}`), archivedItem);
    await remove(ref(appDb, `global_tasks/${itemToArchive.id}`));

    const remainingItems = items.filter((_, i) => i !== index);
    await updateItemsInDatabase(remainingItems);
  }, [items, updateItemsInDatabase]);

  const openDeleteDialog = useCallback((index) => {
    setItemToDelete({ index, ...items[index] });
    setDeleteDialogOpen(true);
  }, [items]);

  const closeDeleteDialog = useCallback(() => {
    setDeleteDialogOpen(false);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (itemToDelete) {
      await remove(ref(appDb, `global_tasks/${itemToDelete.id}`));

      const remainingItems = items.filter((_, i) => i !== itemToDelete.index);
      await updateItemsInDatabase(remainingItems);
    }
    closeDeleteDialog();
  }, [itemToDelete, items, updateItemsInDatabase, closeDeleteDialog]);

  return (
    <Box>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="droppable-list">
          {(provided) => (
            <List {...provided.droppableProps} ref={provided.innerRef}>
              {items.map((item, index) => (
                <Draggable key={item.id} draggableId={item.id} index={index}>
                  {(provided, snapshot) => (
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
        onConfirm={confirmDelete}
        itemText={itemToDelete?.text}
      />
    </Box>
  );
};

export default OrderedList;