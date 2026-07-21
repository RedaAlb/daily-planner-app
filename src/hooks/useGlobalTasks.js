import { useState, useEffect, useCallback } from 'react';
import { ref, onValue, update, set, remove } from 'firebase/database';
import { appDb } from '../utils/Firebase';
import { GLOBAL_TASKS_PATH, ARCHIVED_GLOBAL_TASKS_PATH } from '../utils/constants';

const useGlobalTasks = () => {
  const [items, setItems] = useState([]);
  const [archivedItems, setArchivedItems] = useState([]);

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
      tasksListener();
      archivedListener();
    };
  }, []);

  const updateItemsInDatabase = useCallback(async (updatedItems) => {
    const updates = {};
    updatedItems.forEach((item, index) => {
      updates[`${GLOBAL_TASKS_PATH}/${item.id}`] = {
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

    await set(ref(appDb, `${GLOBAL_TASKS_PATH}/${items[index].id}`), updatedItem);
  }, [items]);

  const handleTextChange = useCallback(async (index, value) => {
    const updatedItem = {
      ...items[index],
      text: value
    };

    await set(ref(appDb, `${GLOBAL_TASKS_PATH}/${items[index].id}`), updatedItem);
  }, [items]);

  const archiveItem = useCallback(async (index) => {
    const itemToArchive = items[index];
    const archivedItem = {
      ...itemToArchive,
      archivedAt: Date.now()
    };

    await set(ref(appDb, `${ARCHIVED_GLOBAL_TASKS_PATH}/${itemToArchive.id}`), archivedItem);
    await remove(ref(appDb, `${GLOBAL_TASKS_PATH}/${itemToArchive.id}`));

    const remainingItems = items.filter((_, i) => i !== index);
    await updateItemsInDatabase(remainingItems);
  }, [items, updateItemsInDatabase]);

  const confirmDelete = useCallback(async (index) => {
    const itemToDelete = items[index];
    if (itemToDelete) {
      await remove(ref(appDb, `${GLOBAL_TASKS_PATH}/${itemToDelete.id}`));

      const remainingItems = items.filter((_, i) => i !== index);
      await updateItemsInDatabase(remainingItems);
    }
  }, [items, updateItemsInDatabase]);

  const unarchiveItem = useCallback(async (index) => {
    const itemToUnarchive = archivedItems[index];

    const currentOrders = items.map(task => task.order);
    const nextOrder = currentOrders.length > 0 ? Math.max(...currentOrders) + 1 : 0;

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

  return {
    items,
    archivedItems,
    handleDragEnd,
    moveToTop,
    moveToBottom,
    onAddTask,
    toggleCheckbox,
    handleTextChange,
    archiveItem,
    confirmDelete,
    unarchiveItem,
    deleteArchivedItem
  };
};

export default useGlobalTasks;
