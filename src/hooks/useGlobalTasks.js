import { useState, useEffect, useCallback } from 'react';
import { ref, onValue, update, set, remove, push } from 'firebase/database';
import { appDb } from '../utils/Firebase';
import { GLOBAL_TASKS_PATH, ARCHIVED_GLOBAL_TASKS_PATH, GLOBAL_TASK_GROUPS_PATH } from '../utils/constants';

const useGlobalTasks = () => {
  const [items, setItems] = useState([]);
  const [archivedItems, setArchivedItems] = useState([]);
  const [groups, setGroups] = useState({});

  useEffect(() => {
    const tasksRef = ref(appDb, GLOBAL_TASKS_PATH);
    const archivedTasksRef = ref(appDb, ARCHIVED_GLOBAL_TASKS_PATH);

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
    }, (error) => {
      console.error("Firebase error fetching archived tasks:", error);
      setArchivedItems([]);
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
      archivedListener();
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

  const archiveItem = useCallback(async (taskId) => {
    const itemToArchive = items.find(i => i.id === taskId);
    if (!itemToArchive) return;

    const archivedItem = {
      ...itemToArchive,
      archivedAt: Date.now()
    };

    await set(ref(appDb, `${ARCHIVED_GLOBAL_TASKS_PATH}/${itemToArchive.id}`), archivedItem);
    await remove(ref(appDb, `${GLOBAL_TASKS_PATH}/${itemToArchive.id}`));

    const remainingItems = items.filter(i => i.id !== taskId);
    await updateItemsInDatabase(remainingItems);
  }, [items, updateItemsInDatabase]);

  const confirmDelete = useCallback(async (taskId) => {
    const itemToDelete = items.find(i => i.id === taskId);
    if (itemToDelete) {
      await remove(ref(appDb, `${GLOBAL_TASKS_PATH}/${itemToDelete.id}`));
      const remainingItems = items.filter(i => i.id !== taskId);
      await updateItemsInDatabase(remainingItems);
    }
  }, [items, updateItemsInDatabase]);

  const unarchiveItem = useCallback(async (index) => {
    const itemToUnarchive = archivedItems[index];

    const nextOrder = items.length > 0 ? Math.max(0, ...items.map(t => t.order ?? 0)) + 1 : 0;

    const restoredTask = {
      ...itemToUnarchive,
      order: nextOrder,
    };
    delete restoredTask.archivedAt;

    const updates = {};
    updates[`${GLOBAL_TASKS_PATH}/${itemToUnarchive.id}`] = restoredTask;
    updates[`${ARCHIVED_GLOBAL_TASKS_PATH}/${itemToUnarchive.id}`] = null;

    await update(ref(appDb), updates);
  }, [archivedItems, items]);

  const deleteArchivedItem = useCallback(async (index) => {
    const itemToDelete = archivedItems[index];
    if (itemToDelete) {
      await remove(ref(appDb, `${ARCHIVED_GLOBAL_TASKS_PATH}/${itemToDelete.id}`));
    }
  }, [archivedItems]);

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

  return {
    items,
    archivedItems,
    groups,
    handleDragEnd,
    moveToTop,
    moveToBottom,
    onAddTask,
    toggleCheckbox,
    handleTextChange,
    archiveItem,
    confirmDelete,
    unarchiveItem,
    deleteArchivedItem,
    createGroup,
    assignGroup
  };
};

export default useGlobalTasks;
