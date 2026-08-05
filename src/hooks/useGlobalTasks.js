import { useState, useEffect, useCallback } from 'react';
import { ref, onValue, update, set, remove, push } from 'firebase/database';
import { appDb } from '../utils/Firebase';
import { GLOBAL_TASKS_PATH, GLOBAL_TASK_GROUPS_PATH } from '../utils/constants';

const useGlobalTasks = () => {
  const [items, setItems] = useState([]);
  const [groups, setGroups] = useState({});

  useEffect(() => {
    const tasksRef = ref(appDb, GLOBAL_TASKS_PATH);

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
    }, (error) => {
      console.error("Firebase error fetching tasks:", error);
      setItems([]);
    });


    const groupsRef = ref(appDb, GLOBAL_TASK_GROUPS_PATH);
    const groupsListener = onValue(groupsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setGroups(data);
      } else {
        setGroups({});
      }
    }, (error) => {
      console.error("Firebase error fetching groups:", error);
      setGroups({});
    });

    return () => {
      tasksListener();
      groupsListener();
    };
  }, []);

  const updateItemsInDatabase = useCallback(async (updatedItems) => {
    const updates = {};
    const groupCounters = {};

    updatedItems.forEach((item) => {
      const gId = item.groupId || 'ungrouped';
      if (groupCounters[gId] === undefined) groupCounters[gId] = 0;
      
      updates[`${GLOBAL_TASKS_PATH}/${item.id}`] = {
        ...item,
        order: groupCounters[gId]
      };
      groupCounters[gId]++;
    });
    await update(ref(appDb), updates);
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
    
    const groupItems = items.filter(i => (i.groupId || null) === groupId);
    const otherItems = items.filter(i => (i.groupId || null) !== groupId);

    const [movedItem] = groupItems.splice(result.source.index, 1);
    groupItems.splice(result.destination.index, 0, movedItem);

    await updateItemsInDatabase([...groupItems, ...otherItems]);
  }, [items, groups, updateItemsInDatabase]);

  const moveToTop = useCallback(async (taskId) => {
    const itemToMove = items.find(i => i.id === taskId);
    if (!itemToMove) return;
    
    const groupId = itemToMove.groupId || null;
    const groupItems = items.filter(i => (i.groupId || null) === groupId);
    const otherItems = items.filter(i => (i.groupId || null) !== groupId);

    const groupIndex = groupItems.findIndex(i => i.id === taskId);
    const [movedItem] = groupItems.splice(groupIndex, 1);
    groupItems.unshift(movedItem);

    await updateItemsInDatabase([...groupItems, ...otherItems]);
  }, [items, updateItemsInDatabase]);

  const moveToBottom = useCallback(async (taskId) => {
    const itemToMove = items.find(i => i.id === taskId);
    if (!itemToMove) return;

    const groupId = itemToMove.groupId || null;
    const groupItems = items.filter(i => (i.groupId || null) === groupId);
    const otherItems = items.filter(i => (i.groupId || null) !== groupId);

    const groupIndex = groupItems.findIndex(i => i.id === taskId);
    const [movedItem] = groupItems.splice(groupIndex, 1);

    const uncheckedItems = groupItems.filter(item => !item.checked);
    const checkedItems = groupItems.filter(item => item.checked);

    const updatedGroupItems = [...uncheckedItems, movedItem, ...checkedItems];
    
    await updateItemsInDatabase([...updatedGroupItems, ...otherItems]);
  }, [items, updateItemsInDatabase]);

  const onAddTask = useCallback(async (groupId = null) => {
    const newItemId = push(ref(appDb, GLOBAL_TASKS_PATH)).key;
    const newItem = {
      id: newItemId,
      text: "",
      checked: false,
      order: 0,
      groupId: groupId,
      createdAt: Date.now()
    };

    const groupItems = items.filter(item => (item.groupId || null) === groupId);
    const otherItems = items.filter(item => (item.groupId || null) !== groupId);

    const updatedGroupItems = [newItem, ...groupItems];
    await updateItemsInDatabase([...updatedGroupItems, ...otherItems]);
  }, [items, updateItemsInDatabase]);

  const toggleCheckbox = useCallback(async (taskId, checked) => {
    const updatedItem = items.find(i => i.id === taskId);
    if (updatedItem) {
      await set(ref(appDb, `${GLOBAL_TASKS_PATH}/${taskId}`), {
        ...updatedItem,
        checked: checked,
        checkedAt: Date.now()
      });
    }
  }, [items]);

  const handleTextChange = useCallback(async (taskId, value) => {
    const updatedItem = items.find(i => i.id === taskId);
    if (updatedItem) {
      await set(ref(appDb, `${GLOBAL_TASKS_PATH}/${taskId}`), {
        ...updatedItem,
        text: value
      });
    }
  }, [items]);

  const confirmDelete = useCallback(async (taskId) => {
    const itemToDelete = items.find(i => i.id === taskId);
    if (itemToDelete) {
      await remove(ref(appDb, `${GLOBAL_TASKS_PATH}/${itemToDelete.id}`));
      const remainingItems = items.filter(i => i.id !== taskId);
      await updateItemsInDatabase(remainingItems);
    }
  }, [items, updateItemsInDatabase]);

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
    const updatedItem = items.find(i => i.id === taskId);
    if (updatedItem) {
      await set(ref(appDb, `${GLOBAL_TASKS_PATH}/${taskId}`), {
        ...updatedItem,
        groupId: groupId
      });
    }
  }, [items]);

  const renameGroup = useCallback(async (groupId, newName) => {
    if (!groups[groupId]) return;
    await set(ref(appDb, `${GLOBAL_TASK_GROUPS_PATH}/${groupId}`), {
      ...groups[groupId],
      name: newName
    });
  }, [groups]);

  const deleteGroup = useCallback(async (groupId) => {
    const updates = {};

    // Unassign all tasks from this group
    items.forEach(item => {
      if (item.groupId === groupId) {
        updates[`${GLOBAL_TASKS_PATH}/${item.id}/groupId`] = null;
      }
    });

    // Remove the group itself
    updates[`${GLOBAL_TASK_GROUPS_PATH}/${groupId}`] = null;

    await update(ref(appDb), updates);
  }, [items, groups]);

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
    deleteGroup
  };
};

export default useGlobalTasks;
