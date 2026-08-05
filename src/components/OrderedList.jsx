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
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from '@mui/icons-material/Edit';
import DragHandleIcon from "@mui/icons-material/DragHandle";
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import FolderIcon from '@mui/icons-material/Folder';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker';
import gbLocale from "date-fns/locale/en-GB";

import {
  DEFAULT_HORI_GAP,
  MAIN_COLOUR,
  MAIN_LINE_HEIGHT,
  SECONDARY_FONT_SIZE,
  TASK_ITEM_MIN_HEIGHT
} from "../utils/constants";

import { moveGlobalTaskToDailyPlanner } from "../utils/Firebase";
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
  onDelete,
  onOpenGroupAssigner,
  showTaskDragHandles = true
}) => {
  const [localChecked, setLocalChecked] = useState(item.checked);
  const [anchorEl, setAnchorEl] = useState(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
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

  const handleOpenDatePicker = useCallback(() => {
    handleMenuClose();
    setDatePickerOpen(true);
  }, [handleMenuClose]);

  const handleMoveToDate = useCallback(async (targetDate) => {
    if (!targetDate) return;
    setDatePickerOpen(false);
    await moveGlobalTaskToDailyPlanner(item, targetDate);
  }, [item]);

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
          width: "100%",
          paddingLeft: showTaskDragHandles ? 0 : "10px",
          paddingRight: "12px",
          boxSizing: "border-box"
        }}
      >
        {showTaskDragHandles && (
          <Box
            {...provided.dragHandleProps}
            sx={{ display: 'flex', alignItems: 'center', cursor: "grab", pl: "10px", pr: "5px", color: MAIN_COLOUR }}
          >
            <DragHandleIcon />
          </Box>
        )}

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
            flex: 1,
            minWidth: 0,
            width: "100%",
            overflow: "hidden",
            fontSize: SECONDARY_FONT_SIZE
          }}
        />

        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={gbLocale}>
          <MobileDatePicker
            open={datePickerOpen}
            onClose={() => setDatePickerOpen(false)}
            onChange={(newDate) => handleMoveToDate(newDate)}
            renderInput={() => <span style={{ display: 'none' }} />}
            value={new Date()}
            DialogProps={{ disableScrollLock: true }}
          />
        </LocalizationProvider>

        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", flexShrink: 0, ml: 1 }}>
          {item.groupId ? (
            <IconButton 
              size="small"
              onClick={() => setDatePickerOpen(true)} 
              title="Move to date..."
              sx={{ color: MAIN_COLOUR, padding: '4px' }}
            >
              <CalendarTodayIcon fontSize="small" />
            </IconButton>
          ) : (
            <IconButton 
              size="small"
              onClick={(e) => onOpenGroupAssigner(e, item.id)} 
              title="Assign Group"
              sx={{ color: MAIN_COLOUR, padding: '4px' }}
            >
              <FolderIcon fontSize="small" />
            </IconButton>
          )}
          <IconButton 
            size="small"
            onClick={handleMenuClick} 
            title="More actions"
            sx={{ color: MAIN_COLOUR, padding: '4px' }}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
          <Menu
            disableScrollLock={true}
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
            {item.groupId ? (
              <MenuItem onClick={() => {
                onOpenGroupAssigner({ currentTarget: anchorEl }, item.id);
                handleMenuClose();
              }}>
                <ListItemIcon><FolderIcon fontSize="small" /></ListItemIcon>
                <ListItemText>Move to group</ListItemText>
              </MenuItem>
            ) : (
              <MenuItem onClick={handleOpenDatePicker}>
                <ListItemIcon><CalendarTodayIcon fontSize="small" /></ListItemIcon>
                <ListItemText>Move to date...</ListItemText>
              </MenuItem>
            )}
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

const OrderedList = ({
  showGroupDragHandles = false,
  showTaskDragHandles = true,
  toggleExpandAllSignal,
  setIsAllExpanded
}) => {
  const {
    items,
    groups,
    handleDragEnd,
    moveToTop,
    moveToBottom,
    onAddTask,
    toggleCheckbox,
    handleTextChange,
    confirmDelete,
    createGroup,
    assignGroup,
    renameGroup,
    deleteGroup
  } = useGlobalTasks();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDeleteId, setItemToDeleteId] = useState(null);

  const [assignerAnchorEl, setAssignerAnchorEl] = useState(null);
  const [assignerTaskId, setAssignerTaskId] = useState(null);

  const [newGroupDialogOpen, setNewGroupDialogOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  // Accordion expanded state
  const [expandedGroups, setExpandedGroups] = useState({});

  const handleAccordionChange = useCallback((groupKey) => (event, isExpanded) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupKey]: isExpanded
    }));
  }, []);

  // Group context menu state
  const [groupMenuAnchorEl, setGroupMenuAnchorEl] = useState(null);
  const [groupMenuId, setGroupMenuId] = useState(null);

  // Rename group dialog state
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameGroupId, setRenameGroupId] = useState(null);
  const [renameGroupName, setRenameGroupName] = useState('');

  // Delete group dialog state
  const [deleteGroupDialogOpen, setDeleteGroupDialogOpen] = useState(false);
  const [deleteGroupId, setDeleteGroupId] = useState(null);

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

  // Group context menu handlers
  const handleOpenGroupMenu = useCallback((event, groupId) => {
    event.stopPropagation();
    setGroupMenuAnchorEl(event.currentTarget);
    setGroupMenuId(groupId);
  }, []);

  const handleCloseGroupMenu = useCallback(() => {
    setGroupMenuAnchorEl(null);
    setGroupMenuId(null);
  }, []);

  const handleOpenRenameDialog = useCallback(() => {
    const group = groups[groupMenuId];
    if (group) {
      setRenameGroupId(groupMenuId);
      setRenameGroupName(group.name);
      setRenameDialogOpen(true);
    }
    handleCloseGroupMenu();
  }, [groupMenuId, groups, handleCloseGroupMenu]);

  const handleCloseRenameDialog = useCallback(() => {
    setRenameDialogOpen(false);
    setRenameGroupId(null);
    setRenameGroupName('');
  }, []);

  const handleConfirmRename = useCallback(async () => {
    if (renameGroupId && renameGroupName.trim()) {
      await renameGroup(renameGroupId, renameGroupName.trim());
    }
    handleCloseRenameDialog();
  }, [renameGroupId, renameGroupName, renameGroup, handleCloseRenameDialog]);

  const handleOpenDeleteGroupDialog = useCallback(() => {
    setDeleteGroupId(groupMenuId);
    setDeleteGroupDialogOpen(true);
    handleCloseGroupMenu();
  }, [groupMenuId, handleCloseGroupMenu]);

  const handleCloseDeleteGroupDialog = useCallback(() => {
    setDeleteGroupDialogOpen(false);
    setDeleteGroupId(null);
  }, []);

  const handleConfirmDeleteGroup = useCallback(async () => {
    if (deleteGroupId) {
      await deleteGroup(deleteGroupId);
    }
    handleCloseDeleteGroupDialog();
  }, [deleteGroupId, deleteGroup, handleCloseDeleteGroupDialog]);

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

  const allGroupKeys = useMemo(() => ['ungrouped', ...sortedGroupKeys], [sortedGroupKeys]);

  const isAnyExpanded = useMemo(() => {
    return allGroupKeys.some(k => expandedGroups[k] !== false);
  }, [allGroupKeys, expandedGroups]);

  useEffect(() => {
    if (setIsAllExpanded) {
      setIsAllExpanded(isAnyExpanded);
    }
  }, [isAnyExpanded, setIsAllExpanded]);

  const isFirstRender = React.useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (toggleExpandAllSignal > 0) {
      setExpandedGroups(() => {
        const newExpanded = {};
        allGroupKeys.forEach(k => {
          newExpanded[k] = !isAnyExpanded;
        });
        return newExpanded;
      });
    }
  }, [toggleExpandAllSignal]);

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
              defaultExpanded 
              expanded={expandedGroups[groupKey] !== false}
              onChange={handleAccordionChange(groupKey)}
              disableGutters 
              elevation={0} 
              sx={{ 
                '&:before': { display: 'none' },
                borderBottom: `1px solid ${MAIN_COLOUR}40`,
                mb: 0,
                bgcolor: 'transparent'
              }}
            >
              <AccordionSummary 
                sx={{
                  bgcolor: `rgba(0, 0, 0, 0.04)`,
                  borderRadius: '4px',
                  minHeight: '48px',
                  '& .MuiAccordionSummary-content': { my: 1 }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: "#181818" }}>
                    {group.name}
                  </Typography>
                  <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center' }}>
                    {group.items.length > 0 && (
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: 'text.secondary', 
                          mr: 1, 
                          fontWeight: 'bold',
                          bgcolor: 'rgba(0,0,0,0.06)',
                          borderRadius: '50%',
                          width: '22px',
                          height: '22px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          lineHeight: 1
                        }}
                      >
                        {group.items.length}
                      </Typography>
                    )}
                    <IconButton 
                      size="small" 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setExpandedGroups(prev => ({ ...prev, [groupKey]: true }));
                        onAddTask(null); 
                      }} 
                      title="Add Task to Group"
                    >
                      <AddIcon fontSize="small" />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      sx={{ visibility: 'hidden', pointerEvents: 'none' }}
                      tabIndex={-1}
                      aria-hidden="true"
                    >
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </Box>
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
                              onDelete={openDeleteDialog}
                              onOpenGroupAssigner={handleOpenGroupAssigner}
                              showTaskDragHandles={showTaskDragHandles}
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
                        defaultExpanded 
                        expanded={expandedGroups[groupKey] !== false}
                        onChange={handleAccordionChange(groupKey)}
                        disableGutters 
                        elevation={0} 
                        sx={{ 
                          '&:before': { display: 'none' },
                          borderBottom: `1px solid ${MAIN_COLOUR}40`,
                          mb: 0,
                          bgcolor: 'transparent'
                        }}
                      >
                        <AccordionSummary 
                          sx={{
                            bgcolor: `${MAIN_COLOUR}15`,
                            borderRadius: '4px',
                            minHeight: '48px',
                            '& .MuiAccordionSummary-content': { my: 1 }
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                            {showGroupDragHandles && (
                              <Box {...providedGroup.dragHandleProps} sx={{ display: 'flex', alignItems: 'center', mr: 1, cursor: 'grab', color: MAIN_COLOUR }}>
                                <DragHandleIcon fontSize="small" />
                              </Box>
                            )}
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: "#181818" }}>
                              {group.name}
                            </Typography>
                            <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center' }}>
                              {group.items.length > 0 && (
                                <Typography 
                                  variant="caption" 
                                  sx={{ 
                                    color: 'text.secondary', 
                                    mr: 1, 
                                    fontWeight: 'bold',
                                    bgcolor: 'rgba(0,0,0,0.06)',
                                    borderRadius: '50%',
                                    width: '22px',
                                    height: '22px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    lineHeight: 1
                                  }}
                                >
                                  {group.items.length}
                                </Typography>
                              )}
                              <IconButton 
                                size="small" 
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  setExpandedGroups(prev => ({ ...prev, [groupKey]: true }));
                                  onAddTask(groupKey); 
                                }} 
                                title="Add Task to Group"
                              >
                                <AddIcon fontSize="small" />
                              </IconButton>
                              <IconButton 
                                size="small" 
                                onClick={(e) => handleOpenGroupMenu(e, groupKey)} 
                                title="Group options"
                              >
                                <MoreVertIcon fontSize="small" />
                              </IconButton>
                            </Box>
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
                                        onDelete={openDeleteDialog}
                                        onOpenGroupAssigner={handleOpenGroupAssigner}
                                        showTaskDragHandles={showTaskDragHandles}
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

      <Dialog disableScrollLock={true} open={newGroupDialogOpen} onClose={handleCloseNewGroupDialog} maxWidth="xs" fullWidth>
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

      {/* Group context menu */}
      <Menu
        disableScrollLock={true}
        anchorEl={groupMenuAnchorEl}
        open={Boolean(groupMenuAnchorEl)}
        onClose={handleCloseGroupMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={handleOpenRenameDialog}>
          <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Rename</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleOpenDeleteGroupDialog} sx={{ color: 'error.main' }}>
          <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
          <ListItemText>Delete Group</ListItemText>
        </MenuItem>
      </Menu>

      {/* Rename group dialog */}
      <Dialog disableScrollLock={true} open={renameDialogOpen} onClose={handleCloseRenameDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Rename Group</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Group Name"
            type="text"
            fullWidth
            variant="outlined"
            value={renameGroupName}
            onChange={(e) => setRenameGroupName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleConfirmRename();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRenameDialog}>Cancel</Button>
          <Button onClick={handleConfirmRename} variant="contained" color="primary" disabled={!renameGroupName.trim()}>
            Rename
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete group confirmation dialog */}
      <DeleteDialog
        open={deleteGroupDialogOpen}
        onClose={handleCloseDeleteGroupDialog}
        onConfirm={handleConfirmDeleteGroup}
        itemText={deleteGroupId && groups[deleteGroupId] ? groups[deleteGroupId].name : ""}
        title="Delete Group"
        textPrefix="Tasks in this group will be moved to Ungrouped. Delete group:"
      />
    </Box>
  );
};

export default OrderedList;