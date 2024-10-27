import React, { useState, useEffect } from "react";
import {
  List,
  ListItem,
  IconButton,
  Box,
  ListItemIcon,
  TextareaAutosize,
  Checkbox,
  Fab,
} from "@mui/material";
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArchiveIcon from "@mui/icons-material/Archive";
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

const fetchItemsFromDatabase = async () => {
  return [
    { id: "1", text: "Item 1", checked: false, order: 0 },
    { id: "2", text: "Item 2", checked: false, order: 1 },
    { id: "3", text: "Item 3", checked: false, order: 2 },
  ];
};


const updateItemOrderInDatabase = async (updatedItems) => {

};

const OrderedList = () => {
  const [items, setItems] = useState([]);

  const [archivedItems, setArchivedItems] = useState([]);

  useEffect(() => {
    fetchItemsFromDatabase().then(fetchedItems => setItems(fetchedItems));
  }, []);

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const newItems = Array.from(items);
    const [movedItem] = newItems.splice(result.source.index, 1);
    newItems.splice(result.destination.index, 0, movedItem);

    setItems(newItems);
    updateItemOrderInDatabase(newItems);
  };

  const moveToTop = (index) => {
    const newItems = [...items];
    const [movedItem] = newItems.splice(index, 1);
    newItems.unshift(movedItem);

    // Update order values
    newItems.forEach((item, i) => item.order = i);
    setItems(newItems);
    updateItemOrderInDatabase(newItems);
  };

  const moveToBottom = (index) => {
    const newItems = [...items];
    const [movedItem] = newItems.splice(index, 1);

    const uncheckedItems = newItems.filter(item => !item.checked);
    const checkedItems = newItems.filter(item => item.checked);
    checkedItems.unshift(movedItem);

    const updatedItems = [...uncheckedItems, ...checkedItems];
    updatedItems.forEach((item, i) => item.order = i);
    setItems(updatedItems);
    updateItemOrderInDatabase(updatedItems);
  };

  const onAddTask = () => {
    const newItem = {
      id: `${Date.now()}`,
      text: "",
      checked: false,
      order: 0,
    };

    const updatedItems = [newItem, ...items.map(item => ({ ...item, order: item.order + 1 }))];
    setItems(updatedItems);
    updateItemOrderInDatabase(updatedItems);
  };

  const toggleCheckbox = (index) => {
    const newItems = [...items];
    newItems[index].checked = !newItems[index].checked;
    setItems(newItems);
    updateItemOrderInDatabase(newItems);
  };

  const handleTextChange = (index, value) => {
    const newItems = [...items];
    newItems[index].text = value;
    setItems(newItems);
    // Save text change to the database as well
  };

  const archiveItem = (index) => {
    const newItems = [...items];
    const [archivedItem] = newItems.splice(index, 1);
    setArchivedItems([...archivedItems, archivedItem]);
    setItems(newItems);
    // Save to database as well.
  };

  const notCheckedIcon = <CheckBoxOutlineBlankIcon fontSize="inherit" sx={{ color: MAIN_COLOUR }} />;
  const checkedIcon = <CheckBoxIcon fontSize="inherit" sx={{ color: MAIN_COLOUR }} />;

  return (
    <Box>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="droppable-list">
          {(provided) => (
            <List {...provided.droppableProps} ref={provided.innerRef}>
              {items.map((item, index) => (
                <Draggable key={item.id} draggableId={item.id} index={index}>
                  {(provided, snapshot) => (
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
                          checked={item.checked}
                          onClick={() => toggleCheckbox(index)}
                          icon={notCheckedIcon}
                          checkedIcon={checkedIcon}
                          sx={{ padding: 0, fontSize: "30px" }}
                        />

                        <TextareaAutosize
                          value={item.text}
                          onChange={(e) => handleTextChange(index, e.target.value)}
                          style={{
                            width: "100%",
                            overflow: "hidden",
                            fontSize: SECONDARY_FONT_SIZE
                          }}
                        />

                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "flex-end",
                          }}
                        >
                          <IconButton edge="end" onClick={() => moveToTop(index)}>
                            <ArrowUpwardIcon />
                          </IconButton>
                          <IconButton edge="end" onClick={() => moveToBottom(index)}>
                            <ArrowDownwardIcon />
                          </IconButton>
                          <IconButton
                            edge="end"
                            onClick={() => archiveItem(index)}
                            sx={{ marginLeft: "10px" }}
                          >
                            <ArchiveIcon />
                          </IconButton>
                        </Box>
                      </div>
                    </ListItem>
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
    </Box>
  );
};

export default OrderedList;
