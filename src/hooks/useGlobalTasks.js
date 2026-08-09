import { useState, useEffect, useCallback } from 'react';
import { ref, onValue, update, set, remove, push } from 'firebase/database';
import { appDb, moveDailyTaskToGlobal, updateTask as updateDailyTask, subscribeToAllGroupedTasks } from '../utils/Firebase';
import { GLOBAL_TASKS_PATH, GLOBAL_TASK_GROUPS_PATH } from '../utils/constants';

// Parse a dateKey like "5-8-2026" into a Date object
const parseDateKey = (dateKey) => {
  if (!dateKey) return null;
  const parts = dateKey.split('-');
  if (parts.length !== 3) return null;
  const [d, m, y] = parts;
  return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
};

const useGlobalTasks = () => {
  const [globalItems, setGlobalItems] = useState([]);
  const [dailyGroupedItems, setDailyGroupedItems] = useState([]);
  const [groups, setGroups] = useState({});
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [loadingDaily, setLoadingDaily] = useState(true);
  const [loadingGroups, setLoadingGroups] = useState(true);

  // Subscribe to global_tasks (undated tasks + tasks created in Global Tasks View)
  useEffect(() => {
    const tasksRef = ref(appDb, GLOBAL_TASKS_PATH);

    const tasksListener = onValue(tasksRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const taskArray = Object.entries(data)
          .map(([id, value]) => ({
            id,
            ...value,
            source: 'global'
          }))
          .sort((a, b) => {
            if (a.order === b.order) {
              return (b.createdAt || 0) - (a.createdAt || 0);
            }
            return (a.order || 0) - (b.order || 0);
          });
        setGlobalItems(taskArray);
      } else {
        setGlobalItems([]);
      }
      setLoadingTasks(false);
    }, (error) => {
      console.error("Firebase error fetching tasks:", error);
      setGlobalItems([]);
      setLoadingTasks(false);
    });

    return () => tasksListener();
  }, []);

  // Subscribe to grouped daily tasks (daily planner tasks that have a groupId)
  useEffect(() => {
    const unsubscribe = typeof subscribeToAllGroupedTasks === "function"
      ? subscribeToAllGroupedTasks((groupedTasks) => {
          setDailyGroupedItems(groupedTasks);
          setLoadingDaily(false);
        })
      : null;

    if (!unsubscribe) {
      setLoadingDaily(false);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Subscribe to groups
  useEffect(() => {
    const groupsRef = ref(appDb, GLOBAL_TASK_GROUPS_PATH);
    const groupsListener = onValue(groupsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setGroups(data);
      } else {
        setGroups({});
      }
      setLoadingGroups(false);
    }, (error) => {
      console.error("Firebase error fetching groups:", error);
      setGroups({});
      setLoadingGroups(false);
    });

    return () => groupsListener();
  }, []);

  // Merge both sources into a unified items array
  // Global items already have source: 'global'; daily items have source: 'daily'
  const items = [...globalItems, ...dailyGroupedItems];

  const updateItemsInDatabase = useCallback(async (updatedItems) => {
    // Only update global tasks (daily-sourced tasks are managed by the daily planner)
    const globalOnly = updatedItems.filter(i => i.source !== 'daily');
    const updates = {};
    const groupCounters = {};

    globalOnly.forEach((item) => {
      const gId = item.groupId || 'ungrouped';
      if (groupCounters[gId] === undefined) groupCounters[gId] = 0;
      
      // Strip source metadata before saving
      const { source, dateKey, dateIndex, checkIndex, ...itemData } = item;
      updates[`${GLOBAL_TASKS_PATH}/${item.id}`] = {
        ...itemData,
        order: groupCounters[gId]
      };
      groupCounters[gId]++;
    });
    if (Object.keys(updates).length > 0) {
      await update(ref(appDb), updates);
    }
  }, []);

  const handleDragEnd = useCallback(async (result) => {
    if (!result.destination) return;

    if (result.type === 'group') {
      const keys = Object.values(groups)
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map(g => g.id);
        
      const [movedKey] = keys.splice(result.source.index, 1);
      keys.splice(result.destination.index, 0, movedKey);

      const updates = {};
      keys.forEach((key, index) => {
        updates[`${GLOBAL_TASK_GROUPS_PATH}/${key}/order`] = index;
      });
      await update(ref(appDb), updates);
      return;
    }

    if (result.source.droppableId !== result.destination.droppableId) return;

    const groupId = result.source.droppableId === 'ungrouped' ? null : result.source.droppableId;
    
    // Only reorder undated (global) tasks within a group — dated tasks are auto-sorted
    const groupGlobalItems = globalItems.filter(i => (i.groupId || null) === groupId);
    const otherGlobalItems = globalItems.filter(i => (i.groupId || null) !== groupId);

    // The drag indices correspond to the undated section only (dated tasks are not draggable)
    const [movedItem] = groupGlobalItems.splice(result.source.index, 1);
    groupGlobalItems.splice(result.destination.index, 0, movedItem);

    await updateItemsInDatabase([...groupGlobalItems, ...otherGlobalItems]);
  }, [globalItems, groups, updateItemsInDatabase]);

  const moveToTop = useCallback(async (taskId) => {
    const itemToMove = globalItems.find(i => i.id === taskId);
    if (!itemToMove) return;
    
    const groupId = itemToMove.groupId || null;
    const groupGlobalItems = globalItems.filter(i => (i.groupId || null) === groupId);
    const otherGlobalItems = globalItems.filter(i => (i.groupId || null) !== groupId);

    const groupIndex = groupGlobalItems.findIndex(i => i.id === taskId);
    const [movedItem] = groupGlobalItems.splice(groupIndex, 1);
    groupGlobalItems.unshift(movedItem);

    await updateItemsInDatabase([...groupGlobalItems, ...otherGlobalItems]);
  }, [globalItems, updateItemsInDatabase]);

  const moveToBottom = useCallback(async (taskId) => {
    const itemToMove = globalItems.find(i => i.id === taskId);
    if (!itemToMove) return;

    const groupId = itemToMove.groupId || null;
    const groupGlobalItems = globalItems.filter(i => (i.groupId || null) === groupId);
    const otherGlobalItems = globalItems.filter(i => (i.groupId || null) !== groupId);

    const groupIndex = groupGlobalItems.findIndex(i => i.id === taskId);
    const [movedItem] = groupGlobalItems.splice(groupIndex, 1);

    const uncheckedItems = groupGlobalItems.filter(item => !item.checked);
    const checkedItems = groupGlobalItems.filter(item => item.checked);

    const updatedGroupItems = [...uncheckedItems, movedItem, ...checkedItems];
    
    await updateItemsInDatabase([...updatedGroupItems, ...otherGlobalItems]);
  }, [globalItems, updateItemsInDatabase]);

  const onAddTask = useCallback(async (groupId = null) => {
    const newItemId = push(ref(appDb, GLOBAL_TASKS_PATH)).key;
    const newItem = {
      id: newItemId,
      text: "",
      checked: false,
      order: 0,
      groupId: groupId,
      createdAt: Date.now(),
      source: 'global'
    };

    const groupGlobalItems = globalItems.filter(item => (item.groupId || null) === groupId);
    const otherGlobalItems = globalItems.filter(item => (item.groupId || null) !== groupId);

    const updatedGroupItems = [newItem, ...groupGlobalItems];
    await updateItemsInDatabase([...updatedGroupItems, ...otherGlobalItems]);
  }, [globalItems, updateItemsInDatabase]);

  const toggleCheckbox = useCallback(async (taskId, checked) => {
    // Check if this is a daily-sourced task
    const dailyItem = dailyGroupedItems.find(i => i.id === taskId);
    if (dailyItem) {
      // Route to daily planner update
      const date = parseDateKey(dailyItem.dateKey);
      if (date) {
        await updateDailyTask(date, dailyItem.dateIndex, {
          checkIndex: checked ? 1 : 0
        });
      }
      return;
    }

    // Global task
    const updatedItem = globalItems.find(i => i.id === taskId);
    if (updatedItem) {
      const { source, dateKey, dateIndex, checkIndex, ...itemData } = updatedItem;
      await set(ref(appDb, `${GLOBAL_TASKS_PATH}/${taskId}`), {
        ...itemData,
        checked: checked,
        checkedAt: Date.now()
      });
    }
  }, [globalItems, dailyGroupedItems]);

  const handleTextChange = useCallback(async (taskId, value) => {
    // Check if this is a daily-sourced task
    const dailyItem = dailyGroupedItems.find(i => i.id === taskId);
    if (dailyItem) {
      const date = parseDateKey(dailyItem.dateKey);
      if (date) {
        await updateDailyTask(date, dailyItem.dateIndex, {
          text: value
        });
      }
      return;
    }

    // Global task
    const updatedItem = globalItems.find(i => i.id === taskId);
    if (updatedItem) {
      const { source, dateKey, dateIndex, checkIndex, ...itemData } = updatedItem;
      await set(ref(appDb, `${GLOBAL_TASKS_PATH}/${taskId}`), {
        ...itemData,
        text: value
      });
    }
  }, [globalItems, dailyGroupedItems]);

  const confirmDelete = useCallback(async (taskId) => {
    // Check if this is a daily-sourced task
    const dailyItem = dailyGroupedItems.find(i => i.id === taskId);
    if (dailyItem) {
      // Clear groupId, text, and checkIndex from the daily planner task
      const date = parseDateKey(dailyItem.dateKey);
      if (date) {
        await updateDailyTask(date, dailyItem.dateIndex, {
          checkIndex: 0,
          text: "",
          groupId: null
        });
      }
      return;
    }

    // Global task
    const itemToDelete = globalItems.find(i => i.id === taskId);
    if (itemToDelete) {
      await remove(ref(appDb, `${GLOBAL_TASKS_PATH}/${itemToDelete.id}`));
      const remainingItems = globalItems.filter(i => i.id !== taskId);
      await updateItemsInDatabase(remainingItems);
    }
  }, [globalItems, dailyGroupedItems, updateItemsInDatabase]);

  const createGroup = useCallback(async (name) => {
    const newGroupId = push(ref(appDb, GLOBAL_TASK_GROUPS_PATH)).key;
    const newGroup = {
      id: newGroupId,
      name,
      order: Object.keys(groups).length,
      createdAt: Date.now()
    };
    await set(ref(appDb, `${GLOBAL_TASK_GROUPS_PATH}/${newGroupId}`), newGroup);
    return newGroupId;
  }, [groups]);

  const assignGroup = useCallback(async (taskId, groupId) => {
    // Check if this is a daily-sourced task
    const dailyItem = dailyGroupedItems.find(i => i.id === taskId);
    if (dailyItem) {
      if (!groupId) {
        // Unassigning group from a daily-sourced task in Global Tasks View moves it to global_tasks (ungrouped)
        await moveDailyTaskToGlobal(dailyItem.dateKey, dailyItem.dateIndex, {
          text: dailyItem.text,
          checkIndex: dailyItem.checkIndex ?? 0,
          groupId: null
        });
      } else {
        const date = parseDateKey(dailyItem.dateKey);
        if (date) {
          await updateDailyTask(date, dailyItem.dateIndex, {
            groupId: groupId
          });
        }
      }
      return;
    }

    // Global task
    const updatedItem = globalItems.find(i => i.id === taskId);
    if (updatedItem) {
      const { source, dateKey, dateIndex, checkIndex, ...itemData } = updatedItem;
      await set(ref(appDb, `${GLOBAL_TASKS_PATH}/${taskId}`), {
        ...itemData,
        groupId: groupId || null
      });
    }
  }, [globalItems, dailyGroupedItems]);

  // Remove date from a daily-sourced task, moving it to global_tasks as undated
  const unassignDate = useCallback(async (taskId) => {
    const dailyItem = dailyGroupedItems.find(i => i.id === taskId);
    if (!dailyItem) return;

    await moveDailyTaskToGlobal(dailyItem.dateKey, dailyItem.dateIndex, {
      text: dailyItem.text,
      checkIndex: dailyItem.checkIndex ?? 0,
      groupId: dailyItem.groupId
    });
  }, [dailyGroupedItems]);

  const renameGroup = useCallback(async (groupId, newName) => {
    if (!groups[groupId]) return;
    await set(ref(appDb, `${GLOBAL_TASK_GROUPS_PATH}/${groupId}`), {
      ...groups[groupId],
      name: newName
    });
  }, [groups]);

  const deleteGroup = useCallback(async (groupId) => {
    const updates = {};

    // Unassign all global tasks from this group
    globalItems.forEach(item => {
      if (item.groupId === groupId) {
        updates[`${GLOBAL_TASKS_PATH}/${item.id}/groupId`] = null;
      }
    });

    if (Object.keys(updates).length > 0) {
      await update(ref(appDb), updates);
    }

    // Move all daily tasks in this group to global_tasks (ungrouped) so they move to Ungrouped instead of vanishing
    for (const dailyItem of dailyGroupedItems) {
      if (dailyItem.groupId === groupId) {
        await moveDailyTaskToGlobal(dailyItem.dateKey, dailyItem.dateIndex, {
          text: dailyItem.text,
          checkIndex: dailyItem.checkIndex ?? 0,
          groupId: null
        });
      }
    }

    // Remove the group itself
    await remove(ref(appDb, `${GLOBAL_TASK_GROUPS_PATH}/${groupId}`));
  }, [globalItems, dailyGroupedItems]);

  return {
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
    deleteGroup,
    unassignDate,
    loading: loadingTasks || loadingDaily || loadingGroups
  };
};

export default useGlobalTasks;
