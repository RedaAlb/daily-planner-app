import React, { useState, useEffect, memo, useCallback, useMemo } from "react";
import {
  List,
  ListItem,
  IconButton,
  Box,
  ListItemIcon,
  Checkbox,
  Fab,
  Typography,
  Menu,
  MenuItem,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField
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
import MoreVertIcon from '@mui/icons-material/MoreVert';
import FolderIcon from '@mui/icons-material/Folder';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

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
import GroupAssigner from "./GroupAssigner";


// Memoized list item component with local state management
const ListItemComponent = memo(({
  item,
  provided,
  onToggleCheckbox,
  onTextChange,
  onMoveToTop,
  onMoveToBottom,
  onArchive,
  onDelete,
  onOpenGroupAssigner
}) => {
  const [localChecked, setLocalChecked] = useState(item.checked);
  const [anchorEl, setAnchorEl] = useState(null);
  const menuOpen = Boolean(anchorEl);

  useEffect(() => {
    setLocalChecked(item.checked);
  }, [item.checked]);

  const handleMenuClick = useCallback((event) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleAction = useCallback((actionFn) => {
    actionFn(item.id);
    handleMenuClose();
  }, [item.id, handleMenuClose]);

  const handleTextChange = useCallback((value) => {
    onTextChange(item.id, value);
  }, [item.id, onTextChange]);

  const debouncedToggleCheckbox = useDebounce((checked) => {
    onToggleCheckbox(item.id, checked);
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
          <IconButton edge="end" aria-label="assign group" onClick={(e) => onOpenGroupAssigner(e, item.id)} title="Assign Group">
            <FolderIcon />
          </IconButton>
          <IconButton edge="end" aria-label="more actions" onClick={handleMenuClick} title="More actions">
            <MoreVertIcon />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={menuOpen}
            onClose={handleMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <MenuItem onClick={() => handleAction(onMoveToTop)}>
              <ListItemIcon><ArrowUpwardIcon fontSize="small" /></ListItemIcon>
              <ListItemText>Move to top</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => handleAction(onMoveToBottom)}>
              <ListItemIcon><ArrowDownwardIcon fontSize="small" /></ListItemIcon>
              <ListItemText>Move to bottom</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => handleAction(onArchive)}>
              <ListItemIcon><ArchiveIcon fontSize="small" /></ListItemIcon>
              <ListItemText>Archive</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => handleAction(onDelete)} sx={{ color: 'error.main' }}>
              <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
              <ListItemText>Delete</ListItemText>
            </MenuItem>
          </Menu>
        </Box>
      </div>
    </ListItem>
  );
});

const OrderedList = () => {
  const {
    items,
    groups,
    handleDragEnd,
    moveToTop,
    moveToBottom,
    onAddTask,
    toggleCheckbox,
    handleTextChange,
    archiveItem,
    confirmDelete,
    createGroup,
    assignGroup
  } = useGlobalTasks();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDeleteId, setItemToDeleteId] = useState(null);

  const [assignerAnchorEl, setAssignerAnchorEl] = useState(null);
  const [assignerTaskId, setAssignerTaskId] = useState(null);

  const [newGroupDialogOpen, setNewGroupDialogOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  const handleOpenNewGroupDialog = useCallback(() => {
    setNewGroupDialogOpen(true);
    setNewGroupName('');
  }, []);

  const handleCloseNewGroupDialog = useCallback(() => {
    setNewGroupDialogOpen(false);
  }, []);

  const handleCreateGroup = useCallback(async () => {
    if (newGroupName.trim()) {
      await createGroup(newGroupName.trim());
    }
    handleCloseNewGroupDialog();
  }, [newGroupName, createGroup, handleCloseNewGroupDialog]);

  const openDeleteDialog = useCallback((taskId) => {
    setItemToDeleteId(taskId);
    setDeleteDialogOpen(true);
  }, []);

  const closeDeleteDialog = useCallback(() => {
    setDeleteDialogOpen(false);
    setItemToDeleteId(null);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (itemToDeleteId !== null) {
      await confirmDelete(itemToDeleteId);
    }
    closeDeleteDialog();
  }, [itemToDeleteId, confirmDelete, closeDeleteDialog]);

  const handleOpenGroupAssigner = useCallback((event, taskId) => {
    setAssignerAnchorEl(event.currentTarget);
    setAssignerTaskId(taskId);
  }, []);

  const handleCloseGroupAssigner = useCallback(() => {
    setAssignerAnchorEl(null);
    setAssignerTaskId(null);
  }, []);

  const handleAssignGroup = useCallback((groupId) => {
    if (assignerTaskId) {
      assignGroup(assignerTaskId, groupId);
    }
  }, [assignerTaskId, assignGroup]);

  const groupedItems = useMemo(() => {
    const result = {
      ungrouped: {
        id: 'ungrouped',
        name: 'Ungrouped Tasks',
        items: []
      }
    };
    
    Object.values(groups || {}).forEach(g => {
      result[g.id] = {
        id: g.id,
        name: g.name,
        items: []
      };
    });

    items.forEach(item => {
      const gId = item.groupId || 'ungrouped';
      if (result[gId]) {
        result[gId].items.push(item);
      } else {
        result.ungrouped.items.push(item);
      }
    });

    return result;
  }, [items, groups]);

  const sortedGroupKeys = useMemo(() => {
    const keys = Object.keys(groupedItems).filter(k => k !== 'ungrouped');
    keys.sort((a, b) => {
      const orderA = groups[a]?.order;
      const orderB = groups[b]?.order;
      if (orderA !== undefined && orderB !== undefined && orderA !== orderB) {
        return orderA - orderB;
      }
      return groupedItems[a].name.localeCompare(groupedItems[b].name);
    });
    return keys;
  }, [groupedItems, groups]);

  const itemToDelete = itemToDeleteId ? items.find(i => i.id === itemToDeleteId) : null;
  const assignerTask = assignerTaskId ? items.find(i => i.id === assignerTaskId) : null;

  return (
    <Box>
      <DragDropContext onDragEnd={handleDragEnd}>
        {(() => {
          const groupKey = 'ungrouped';
          const group = groupedItems[groupKey];
          if (group.items.length === 0 && sortedGroupKeys.length > 0) return null;
          return (
            <Accordion 
              key={groupKey} 
              defaultExpanded 
              disableGutters 
              elevation={0} 
              sx={{ 
                '&:before': { display: 'none' },
                borderBottom: `1px solid ${MAIN_COLOUR}40`,
                mb: 2,
                bgcolor: 'transparent'
              }}
            >
              <AccordionSummary 
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  bgcolor: `${MAIN_COLOUR}15`,
                  borderRadius: '4px',
                  minHeight: '48px',
                  '& .MuiAccordionSummary-content': { my: 1 }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: MAIN_COLOUR }}>
                    {group.name} ({group.items.length})
                  </Typography>
                  <IconButton 
                    size="small" 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      onAddTask(null); 
                    }} 
                    sx={{ ml: 'auto', mr: 2 }}
                    title="Add Task to Group"
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0 }}>
                <Droppable droppableId={groupKey} type="task">
                  {(provided) => (
                    <List {...provided.droppableProps} ref={provided.innerRef} sx={{ p: 0 }}>
                      {group.items.length === 0 && (
                        <Typography variant="body2" sx={{ textAlign: "center", py: 3, color: "text.secondary", fontStyle: 'italic' }}>
                          No tasks in this group.
                        </Typography>
                      )}
                      {group.items.map((item, index) => (
                        <Draggable key={item.id} draggableId={item.id} index={index}>
                          {(provided) => (
                            <ListItemComponent
                              item={item}
                              provided={provided}
                              onToggleCheckbox={toggleCheckbox}
                              onTextChange={handleTextChange}
                              onMoveToTop={moveToTop}
                              onMoveToBottom={moveToBottom}
                              onArchive={archiveItem}
                              onDelete={openDeleteDialog}
                              onOpenGroupAssigner={handleOpenGroupAssigner}
                            />
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </List>
                  )}
                </Droppable>
              </AccordionDetails>
            </Accordion>
          );
        })()}

        <Droppable droppableId="group-list" type="group">
          {(providedGroups) => (
            <Box ref={providedGroups.innerRef} {...providedGroups.droppableProps}>
              {sortedGroupKeys.map((groupKey, index) => {
                const group = groupedItems[groupKey];
                return (
                  <Draggable key={groupKey} draggableId={groupKey} index={index}>
                    {(providedGroup) => (
                      <Accordion 
                        ref={providedGroup.innerRef}
                        {...providedGroup.draggableProps}
                        key={groupKey} 
                        defaultExpanded 
                        disableGutters 
                        elevation={0} 
                        sx={{ 
                          '&:before': { display: 'none' },
                          borderBottom: `1px solid ${MAIN_COLOUR}40`,
                          mb: 2,
                          bgcolor: 'transparent'
                        }}
                      >
                        <AccordionSummary 
                          expandIcon={<ExpandMoreIcon />}
                          sx={{
                            bgcolor: `${MAIN_COLOUR}15`,
                            borderRadius: '4px',
                            minHeight: '48px',
                            '& .MuiAccordionSummary-content': { my: 1 }
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                            <Box {...providedGroup.dragHandleProps} sx={{ display: 'flex', alignItems: 'center', mr: 1, cursor: 'grab', color: MAIN_COLOUR }}>
                              <DragHandleIcon fontSize="small" />
                            </Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: MAIN_COLOUR }}>
                              {group.name} ({group.items.length})
                            </Typography>
                            <IconButton 
                              size="small" 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                onAddTask(groupKey); 
                              }} 
                              sx={{ ml: 'auto', mr: 2 }}
                              title="Add Task to Group"
                            >
                              <AddIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails sx={{ p: 0 }}>
                          <Droppable droppableId={groupKey} type="task">
                            {(provided) => (
                              <List {...provided.droppableProps} ref={provided.innerRef} sx={{ p: 0 }}>
                                {group.items.length === 0 && (
                                  <Typography variant="body2" sx={{ textAlign: "center", py: 3, color: "text.secondary", fontStyle: 'italic' }}>
                                    No tasks in this group.
                                  </Typography>
                                )}
                                {group.items.map((item, index) => (
                                  <Draggable key={item.id} draggableId={item.id} index={index}>
                                    {(provided) => (
                                      <ListItemComponent
                                        item={item}
                                        provided={provided}
                                        onToggleCheckbox={toggleCheckbox}
                                        onTextChange={handleTextChange}
                                        onMoveToTop={moveToTop}
                                        onMoveToBottom={moveToBottom}
                                        onArchive={archiveItem}
                                        onDelete={openDeleteDialog}
                                        onOpenGroupAssigner={handleOpenGroupAssigner}
                                      />
                                    )}
                                  </Draggable>
                                ))}
                                {provided.placeholder}
                              </List>
                            )}
                          </Droppable>
                        </AccordionDetails>
                      </Accordion>
                    )}
                  </Draggable>
                );
              })}
              {providedGroups.placeholder}
            </Box>
          )}
        </Droppable>
      </DragDropContext>

      <Fab
        onClick={handleOpenNewGroupDialog}
        color="primary"
        size="large"
        sx={{ position: "fixed", bottom: 76, right: 26, zIndex: 1100 }}
        title="Create Group"
      >
        <AddIcon fontSize="medium" />
      </Fab>

      <Dialog open={newGroupDialogOpen} onClose={handleCloseNewGroupDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Create New Group</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Group Name"
            type="text"
            fullWidth
            variant="outlined"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleCreateGroup();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseNewGroupDialog}>Cancel</Button>
          <Button onClick={handleCreateGroup} variant="contained" color="primary" disabled={!newGroupName.trim()}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      <DeleteDialog
        open={deleteDialogOpen}
        onClose={closeDeleteDialog}
        onConfirm={handleConfirmDelete}
        itemText={itemToDelete ? itemToDelete.text : ""}
        textPrefix="Delete task:"
      />

      <GroupAssigner
        anchorEl={assignerAnchorEl}
        onClose={handleCloseGroupAssigner}
        groups={groups}
        currentGroupId={assignerTask?.groupId || null}
        onAssignGroup={handleAssignGroup}
        onCreateGroup={createGroup}
      />
    </Box>
  );
};

export default OrderedList;