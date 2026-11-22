import { initializeApp } from 'firebase/app';
import * as db from "firebase/database";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';

import { ADD_DATE_KEY, SET_TIME } from "../views/dailyplanner_view/context/dailyplanner-actions";
import { DATE_KEYS_PATH, DAILYBIGS_PATH, NOTES_PATH, ROUTINES_PATH, TASKS_PATH, TIME_PATH, DATE_SAVE_LOCATION, LOCATION_PATH, EXPORTS_DIR_NAME, DEFAULT_TASKS, GLOBAL_TASKS_PATH, GLOBAL_TASK_GROUPS_PATH, NUM_TASK_ITEMS } from "./constants";


const hasFirebaseConfig = Boolean(process.env.REACT_APP_PROJECT_ID && process.env.REACT_APP_DATABASE_URL);

const firebaseConfig = {
  apiKey: process.env.REACT_APP_API_KEY || "demo-key",
  authDomain: process.env.REACT_APP_AUTH_DOMAIN || "demo.firebaseapp.com",
  databaseURL: process.env.REACT_APP_DATABASE_URL || "https://demo-default-rtdb.firebaseio.com",
  projectId: process.env.REACT_APP_PROJECT_ID || "demo-project",
  storageBucket: process.env.REACT_APP_STORAGE_BUCKET || "demo.appspot.com",
  messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID || "000000000",
  appId: process.env.REACT_APP_APP_ID || "1:000000000:web:demo"
};


const app = initializeApp(firebaseConfig);
export const appDb = db.getDatabase(app);
export const auth = getAuth(app);
const dbRef = db.ref(appDb);

const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Google login failed:", error);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout failed:", error);
    throw error;
  }
};

export const subscribeToAuthChanges = (callback) => {
  return onAuthStateChanged(auth, callback);
};


export const loadDate = async (date) => {
  const dateKey = getDbDateKey(date);

  try {
    const snapshot = await db.get(db.child(dbRef, `/${dateKey}/`));
    if (snapshot.exists()) {
      const data = snapshot.val() || {};
      if (data[TASKS_PATH]) data[TASKS_PATH] = normalizeFirebaseArray(data[TASKS_PATH]);
      if (data[DAILYBIGS_PATH]) data[DAILYBIGS_PATH] = normalizeFirebaseArray(data[DAILYBIGS_PATH]);
      if (data[ROUTINES_PATH]) data[ROUTINES_PATH] = normalizeFirebaseArray(data[ROUTINES_PATH]);
      return data;
    }
  } catch (error) {
    // Gracefully handle permission denied (unauthenticated/demo mode)
    if (error?.message?.includes("Permission denied")) {
      console.log("Demo Mode: Firebase access restricted until Google login.");
    } else {
      console.error(error);
    }
  }

  return {};
}


export const getDbDateKey = (date, seperator = "-") => {
  const dateKey = `${date.getDate()}${seperator}${date.getMonth() + 1}${seperator}${date.getFullYear()}`;

  return dateKey;
}


export const deleteDateData = async (date) => {
  const dateKey = getDbDateKey(date);

  try {
    await db.remove(db.ref(appDb, `/${dateKey}`));
    await db.remove(db.ref(appDb, `${DATE_KEYS_PATH}/${dateKey}`));
  } catch (error) {
    console.warn("Firebase delete failed:", error?.message || error);
  }
}


export const parseDateKeys = (data) => {
  if (!data) return [];
  const keys = new Set();
  const isDateKey = (str) => typeof str === 'string' && /^\d{1,2}-\d{1,2}-\d{4}$/.test(str);

  if (Array.isArray(data)) {
    data.forEach(item => { if (isDateKey(item)) keys.add(item); });
  } else if (typeof data === 'object') {
    Object.keys(data).forEach(k => { if (isDateKey(k)) keys.add(k); });
    Object.values(data).forEach(v => { if (isDateKey(v)) keys.add(v); });
  }
  return Array.from(keys);
};

export const loadAllDateKeys = async () => {
  try {
    const snapshot = await db.get(db.ref(appDb, DATE_KEYS_PATH));
    if (snapshot.exists()) {
      return parseDateKeys(snapshot.val());
    }
  } catch (error) {
    if (error?.message?.includes("Permission denied")) {
      console.log("Demo Mode: Firebase access restricted until Google login.");
    } else {
      console.error(error);
    }
  }

  return [];
}

export const subscribeToDate = (date, callback) => {
  const dateKey = getDbDateKey(date);
  const dateRef = db.ref(appDb, `/${dateKey}/`);

  const unsubscribe = db.onValue(dateRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val() || {};
      if (data[TASKS_PATH]) data[TASKS_PATH] = normalizeFirebaseArray(data[TASKS_PATH]);
      if (data[DAILYBIGS_PATH]) data[DAILYBIGS_PATH] = normalizeFirebaseArray(data[DAILYBIGS_PATH]);
      if (data[ROUTINES_PATH]) data[ROUTINES_PATH] = normalizeFirebaseArray(data[ROUTINES_PATH]);
      callback(data);
    } else {
      callback({});
    }
  }, (error) => {
    if (!error?.message?.includes("Permission denied")) {
      console.error("Firebase subscribeToDate error:", error);
    }
  });

  return unsubscribe;
};

export const subscribeToDateKeys = (callback) => {
  const dateKeysRef = db.ref(appDb, DATE_KEYS_PATH);

  const unsubscribe = db.onValue(dateKeysRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(parseDateKeys(snapshot.val()));
    } else {
      callback([]);
    }
  }, (error) => {
    if (!error?.message?.includes("Permission denied")) {
      console.error("Firebase subscribeToDateKeys error:", error);
    }
  });

  return unsubscribe;
};

export const subscribeToGroups = (callback) => {
  const groupsRef = db.ref(appDb, GLOBAL_TASK_GROUPS_PATH);

  const unsubscribe = db.onValue(groupsRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val() || {});
    } else {
      callback({});
    }
  }, (error) => {
    if (!error?.message?.includes("Permission denied")) {
      console.error("Firebase subscribeToGroups error:", error);
    }
  });

  return unsubscribe;
};

export const subscribeToAllTasks = (callback) => {
  const rootRef = db.ref(appDb, "/");

  const unsubscribe = db.onValue(rootRef, (snapshot) => {
    const allData = {};
    if (snapshot.exists()) {
      const dbData = snapshot.val() || {};
      const dateKeys = dbData[DATE_KEYS_PATH] ? Object.keys(dbData[DATE_KEYS_PATH]) : [];

      dateKeys.forEach(dateKey => {
        if (dbData[dateKey] && dbData[dateKey][TASKS_PATH]) {
          const rawTasks = dbData[dateKey][TASKS_PATH];
          allData[dateKey] = normalizeFirebaseArray(rawTasks);
        }
      });
    }
    callback(allData);
  }, (error) => {
    if (!error?.message?.includes("Permission denied")) {
      console.error("Firebase subscribeToAllTasks error:", error);
    }
  });

  return unsubscribe;
};



export const updateRoutine = (date, routineIndex, newData) => {
  const dateKey = getDbDateKey(date);

  return db.set(db.ref(appDb, `${dateKey}/${ROUTINES_PATH}/${routineIndex}/`), newData).catch((err) => {
    console.warn("Firebase write restricted (demo mode or offline):", err?.message || err);
  });
}


export const updateDailyBig = (date, dailyBigIndex, newData) => {
  const dateKey = getDbDateKey(date);

  return db.set(db.ref(appDb, `${dateKey}/${DAILYBIGS_PATH}/${dailyBigIndex}/`), newData).catch((err) => {
    console.warn("Firebase write restricted (demo mode or offline):", err?.message || err);
  });
}


export const updateTask = (date, taskIndex, newData) => {
  const dateKey = getDbDateKey(date);

  const updates = { ...newData };
  if (typeof updates.checked === "boolean" && updates.checkIndex === undefined) {
    updates.checkIndex = updates.checked ? 1 : 0;
  } else if (typeof updates.checkIndex === "number" && updates.checked === undefined) {
    updates.checked = updates.checkIndex === 1;
  }

  return db.update(db.ref(appDb, `${dateKey}/${TASKS_PATH}/${taskIndex}/`), updates).catch((err) => {
    console.warn("Firebase write restricted (demo mode or offline):", err?.message || err);
  });
}

export const compactDateTasks = (tasks) => {
  const normalized = normalizeFirebaseArray(tasks);
  const nonEmpty = normalized.filter(t => t && t.text && typeof t.text === "string" && t.text.trim() !== "");
  const compacted = [...nonEmpty];
  while (compacted.length < NUM_TASK_ITEMS) {
    compacted.push({ checkIndex: 0, checked: false, text: "" });
  }
  return compacted;
};

export const updateDateTasks = (dateKey, tasks) => {
  const sanitizedTasks = compactDateTasks(tasks);

  return db.set(db.ref(appDb, `${dateKey}/${TASKS_PATH}/`), sanitizedTasks)
    .then(() => true)
    .catch((err) => {
      console.warn("Firebase write restricted (demo mode or offline):", err?.message || err);
      return false;
    });
};

export const ensureDateKeyExists = async (dateKey) => {
  if (!dateKey) return;
  try {
    const snapshot = await db.get(db.ref(appDb, `${DATE_KEYS_PATH}/${dateKey}`));
    if (!snapshot.exists()) {
      await db.set(db.ref(appDb, `${DATE_KEYS_PATH}/${dateKey}`), true);
    }
  } catch (error) {
    console.warn("Firebase ensureDateKeyExists failed:", error?.message || error);
  }
};

export const createGlobalTaskGroup = async (name) => {
  const newGroupId = db.push(db.ref(appDb, GLOBAL_TASK_GROUPS_PATH)).key;
  const newGroup = {
    id: newGroupId,
    name,
    order: 0,
    createdAt: Date.now()
  };
  await db.set(db.ref(appDb, `${GLOBAL_TASK_GROUPS_PATH}/${newGroupId}`), newGroup);
  return newGroupId;
};

// Legacy alias kept for backward compatibility with tests; new code should use assignGroupToDailyTask.
export const assignDailyTaskToGlobalGroup = async (taskText, isChecked, groupId) => {
  const newTaskId = db.push(db.ref(appDb, GLOBAL_TASKS_PATH)).key;
  const newTask = {
    id: newTaskId,
    text: taskText || "",
    checked: Boolean(isChecked),
    order: 0,
    groupId: groupId || null,
    createdAt: Date.now()
  };
  await db.set(db.ref(appDb, `${GLOBAL_TASKS_PATH}/${newTaskId}`), newTask);
  return newTaskId;
};

// Assigns (or un-assigns) a groupId on a daily planner task in-place — the task stays on its date.
export const assignGroupToDailyTask = async (date, taskIndex, task, groupId) => {
  await updateTask(date, taskIndex, { groupId: groupId || null });
};

export const moveGlobalTaskToDailyPlanner = async (globalTask, targetDate) => {
  if (!globalTask || !targetDate) return false;

  const targetDateKey = getDbDateKey(targetDate);
  const targetDateData = await loadDate(targetDate);
  const rawTargetTasks = targetDateData[TASKS_PATH];

  const targetTasks = rawTargetTasks && Array.isArray(rawTargetTasks) && rawTargetTasks.length > 0
    ? [...rawTargetTasks]
    : Array.from({ length: NUM_TASK_ITEMS }, () => ({ checkIndex: 0, text: "" }));

  const taskToMove = {
    checkIndex: globalTask.checked ? 1 : 0,
    text: globalTask.text || ""
  };

  // Preserve groupId when moving to daily planner
  if (globalTask.groupId) {
    taskToMove.groupId = globalTask.groupId;
  }

  let emptyIndex = targetTasks.findIndex(t => !t || !t.text || t.text === "");
  if (emptyIndex !== -1) {
    targetTasks[emptyIndex] = taskToMove;
  } else {
    targetTasks.push(taskToMove);
  }

  // FIRST: Save to daily planner in Firebase
  await updateDateTasks(targetDateKey, targetTasks);
  await ensureDateKeyExists(targetDateKey);

  // SECOND: Delete from source
  if (globalTask.source === 'daily' && globalTask.dateKey && typeof globalTask.dateIndex === 'number') {
    if (globalTask.dateKey !== targetDateKey) {
      const sourceTasks = await loadDateTasks(globalTask.dateKey);
      if (sourceTasks && sourceTasks[globalTask.dateIndex]) {
        sourceTasks[globalTask.dateIndex] = { checkIndex: 0, text: "" };
        await updateDateTasks(globalTask.dateKey, sourceTasks);
      }
    }
  } else if (globalTask.id) {
    await db.remove(db.ref(appDb, `${GLOBAL_TASKS_PATH}/${globalTask.id}`));
  }

  return true;
};

// Moves a daily planner task to global_tasks (undated), preserving groupId and text.
// Used by "Remove date" in Global Tasks View.
export const moveDailyTaskToGlobal = async (dateKey, taskIndex, task) => {
  if (!dateKey || taskIndex === undefined || taskIndex === null) return false;

  // Create the task in global_tasks
  const newTaskId = db.push(db.ref(appDb, GLOBAL_TASKS_PATH)).key;
  const newGlobalTask = {
    id: newTaskId,
    text: task.text || "",
    checked: task.checkIndex === 1,
    order: 0,
    groupId: task.groupId || null,
    createdAt: Date.now()
  };
  await db.set(db.ref(appDb, `${GLOBAL_TASKS_PATH}/${newTaskId}`), newGlobalTask);

  // Clear the daily planner slot
  const dateTasks = await loadDateTasks(dateKey);
  if (dateTasks && dateTasks[taskIndex]) {
    dateTasks[taskIndex] = { checkIndex: 0, checked: false, text: "" };
    await updateDateTasks(dateKey, dateTasks);
  }

  return newTaskId;
};

// Moves multiple tasks from the same dateKey to global_tasks in one batch so compacting
// the date's task array once doesn't shift indices for subsequent tasks on the same date.
export const moveDailyTasksToGlobal = async (dateKey, tasksToMove) => {
  if (!dateKey || !Array.isArray(tasksToMove) || tasksToMove.length === 0) return [];

  const createdIds = [];
  const globalUpdates = {};
  const now = Date.now();

  tasksToMove.forEach((item, idx) => {
    const newTaskId = db.push(db.ref(appDb, GLOBAL_TASKS_PATH)).key;
    createdIds.push(newTaskId);
    globalUpdates[`${GLOBAL_TASKS_PATH}/${newTaskId}`] = {
      id: newTaskId,
      text: item.text || "",
      checked: item.checkIndex === 1,
      order: 0,
      groupId: item.groupId || null,
      createdAt: now + idx
    };
  });

  await db.update(db.ref(appDb), globalUpdates);

  const dateTasks = await loadDateTasks(dateKey);
  if (dateTasks) {
    tasksToMove.forEach((item) => {
      if (item.dateIndex !== undefined && item.dateIndex !== null && dateTasks[item.dateIndex]) {
        dateTasks[item.dateIndex] = { checkIndex: 0, checked: false, text: "" };
      }
    });
    await updateDateTasks(dateKey, dateTasks);
  }

  return createdIds;
};

// Helper: load just the tasks array for a dateKey
const loadDateTasks = async (dateKey) => {
  try {
    const snapshot = await db.get(db.child(db.ref(appDb), `/${dateKey}/`));
    if (snapshot.exists()) {
      const data = snapshot.val() || {};
      return data[TASKS_PATH] ? normalizeFirebaseArray(data[TASKS_PATH]) : null;
    }
  } catch (error) {
    console.error("loadDateTasks error:", error);
  }
  return null;
};

// Subscribe to all daily planner tasks that have a groupId set (across all dates).
// Callback receives an array of normalized items with dateKey and taskIndex metadata.
export const subscribeToAllGroupedTasks = (callback) => {
  const rootRef = db.ref(appDb, "/");

  const unsubscribe = db.onValue(rootRef, (snapshot) => {
    const groupedTasks = [];
    if (snapshot.exists()) {
      const dbData = snapshot.val() || {};
      const dateKeys = dbData[DATE_KEYS_PATH] ? Object.keys(dbData[DATE_KEYS_PATH]) : [];

      dateKeys.forEach(dateKey => {
        if (dbData[dateKey] && dbData[dateKey][TASKS_PATH]) {
          const rawTasks = dbData[dateKey][TASKS_PATH];
          const tasks = normalizeFirebaseArray(rawTasks);

          tasks.forEach((task, index) => {
            if (task && task.groupId) {
              const isChecked = typeof task.checked === "boolean" ? task.checked : task.checkIndex === 1;
              groupedTasks.push({
                id: `${dateKey}:${index}`,
                text: task.text || "",
                checked: isChecked,
                groupId: task.groupId,
                order: 0,
                source: "daily",
                dateKey: dateKey,
                dateIndex: index,
                checkIndex: isChecked ? 1 : 0
              });
            }
          });
        }
      });
    }
    callback(groupedTasks);
  }, (error) => {
    if (!error?.message?.includes("Permission denied")) {
      console.error("Firebase subscribeToAllGroupedTasks error:", error);
    }
  });

  return unsubscribe;
};


export const normalizeFirebaseArray = (data) => {
  if (!data) return [];

  let arr;
  if (Array.isArray(data)) {
    arr = [...data];
  } else if (typeof data === "object") {
    arr = [];
    for (const [key, value] of Object.entries(data)) {
      const idx = parseInt(key, 10);
      if (!isNaN(idx)) {
        arr[idx] = value;
      }
    }
  } else {
    return [];
  }

  // Sanitize and standardize every item to have both checked and checkIndex consistent
  for (let i = 0; i < arr.length; i++) {
    if (!arr[i] || typeof arr[i] !== "object") {
      arr[i] = { checkIndex: 0, checked: false, text: "" };
    } else {
      const isChecked = typeof arr[i].checked === "boolean"
        ? arr[i].checked
        : arr[i].checkIndex === 1;
      
      const preserveCheckIndex = typeof arr[i].checkIndex === "number" 
        ? arr[i].checkIndex 
        : (isChecked ? 1 : 0);

      arr[i] = {
        ...arr[i],
        checked: isChecked,
        checkIndex: preserveCheckIndex
      };
    }
  }

  return arr;
};

export const loadAllTasksData = async () => {
  const allData = {};

  try {
    const snapshot = await db.get(db.ref(appDb, "/"));
    if (snapshot.exists()) {
      const dbData = snapshot.val() || {};
      const dateKeys = dbData[DATE_KEYS_PATH] ? Object.keys(dbData[DATE_KEYS_PATH]) : [];

      dateKeys.forEach(dateKey => {
        if (dbData[dateKey] && dbData[dateKey][TASKS_PATH]) {
          const rawTasks = dbData[dateKey][TASKS_PATH];
          allData[dateKey] = normalizeFirebaseArray(rawTasks);
        }
      });
    }
  } catch (error) {
    if (error?.message?.includes("Permission denied")) {
      console.log("Demo Mode: Firebase access restricted until Google login.");
    } else {
      console.error("Firebase loadAllTasksData failed:", error);
    }
  }

  return allData;
}


export const updateNotes = (date, newNotes) => {
  const dateKey = getDbDateKey(date);

  db.set(db.ref(appDb, `${dateKey}/${NOTES_PATH}/`), newNotes).catch((err) => {
    console.warn("Firebase write restricted (demo mode or offline):", err?.message || err);
  });
}


const initializingDates = new Set();

export const initDate = async (date, time, dispatch) => {
  // Save time if not already saved for that date, and anything else that needs to happen only once when date is first used.
  // This is called on routine, daily big, task, or notes change.
  const dateKey = getDbDateKey(date);

  if (time === "" && !initializingDates.has(dateKey)) {
    initializingDates.add(dateKey);
    const newDate = new Date();
    const hh = String(newDate.getHours()).padStart(2, "0");
    const mm = String(newDate.getMinutes()).padStart(2, "0");
    const newTime = `${hh}:${mm}`;

    try {
      await db.set(db.ref(appDb, `${dateKey}/${TIME_PATH}/`), newTime);
      if (dispatch) {
        dispatch({ type: SET_TIME, payload: newTime });  // Update locally to make time visible.
      }

      // Add the dateKey to the db, this is used to add dots to the populated dates in the date picker.
      await db.set(db.ref(appDb, `${DATE_KEYS_PATH}/${dateKey}`), true);
      if (dispatch) {
        dispatch({ type: ADD_DATE_KEY, payload: dateKey });
      }

      // Save location if location setting is turned on.
      const value = localStorage.getItem(DATE_SAVE_LOCATION);

      if (value !== null && value !== "false") {
        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
          });

          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          const locationString = `${latitude} ${longitude}`;

          await db.set(db.ref(appDb, `${dateKey}/${LOCATION_PATH}/`), locationString);
        } catch (error) {
          console.error("Geolocation failed:", error);
        }
      }
    } catch (err) {
      console.warn("Firebase init date write restricted (demo mode or offline):", err?.message || err);
    } finally {
      initializingDates.delete(dateKey);
    }
  }
}


export const updateTime = (date, newTime) => {
  const dateKey = getDbDateKey(date);

  db.set(db.ref(appDb, `${dateKey}/${TIME_PATH}/`), newTime).catch((err) => {
    console.warn("Firebase write restricted (demo mode or offline):", err?.message || err);
  });
}


export const exportDb = async (setExportSnackbar, onError) => {
  const dbData = await db.get(db.ref(appDb, "/")).then((snapshot) => {
    if (snapshot.exists()) {
      return snapshot.val();
    } else {
      return {};
    }
  }).catch((error) => {
    console.warn("Firebase export failed (demo mode or offline):", error?.message || error);
    return null;
  });

  if (!dbData) {
    if (onError) onError("Export failed. Make sure you are signed in and online.");
    return false;
  }

  const dbDataJsonString = JSON.stringify(dbData, null, 2);

  const dt = new Date();
  const nowDateTimeString =
    `${dt.getDate()}-${dt.getMonth() + 1}-${dt.getFullYear()}_${dt.getHours()}-${dt.getMinutes()}-${dt.getSeconds()}`;

  const fileName = `db_${nowDateTimeString}.json`;

  await saveDataToFile(fileName, dbDataJsonString);
  if (setExportSnackbar) setExportSnackbar(true);
  return true;
}


export const saveDataToFile = async (fileName, dataToSave) => {
  const element = document.createElement("a");
  const file = new Blob([dataToSave], {
    type: "application/json;charset=utf-8"
  });

  const objectUrl = URL.createObjectURL(file);
  element.href = objectUrl;
  element.download = fileName;
  element.click();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 100);
}


export const importDb = (setImportSnackbar, onError) => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "application/json,.json";

  input.onchange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (readerEvent) => {
      const content = readerEvent.target?.result;
      let json;
      try {
        json = JSON.parse(content);
      } catch (parseErr) {
        console.warn("Invalid JSON file for import:", parseErr);
        if (onError) onError("Import failed: selected file is not valid JSON.");
        return;
      }

      if (!json || typeof json !== "object" || Array.isArray(json)) {
        if (onError) onError("Import failed: JSON root must be an object.");
        return;
      }

      try {
        await db.set(db.ref(appDb, "/"), json);
        if (setImportSnackbar) setImportSnackbar(true);
      } catch (err) {
        console.warn("Firebase write restricted (demo mode or offline):", err?.message || err);
        if (onError) onError("Import failed. Make sure you are signed in and online.");
      }
    };
    reader.onerror = () => {
      if (onError) onError("Import failed: could not read the selected file.");
    };
    reader.readAsText(file, "UTF-8");
  };

  input.click();
}


export const deleteDb = async () => {
  try {
    await db.set(db.ref(appDb, "/"), null);
    return true;
  } catch (err) {
    console.warn("Firebase write restricted (demo mode or offline):", err?.message || err);
    return false;
  }
}


export const checkConnectionStatus = (setOffline) => {
  if (!hasFirebaseConfig) {
    setOffline(false);
    return () => { };
  }

  const connRef = db.ref(appDb, ".info/connected");

  const unsubscribe = db.onValue(connRef, (snapshot) => {
    if (snapshot.val() === true) {
      setOffline(false);
    } else {
      setOffline(true);
    }
  });

  return unsubscribe;
}