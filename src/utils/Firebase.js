import { initializeApp } from 'firebase/app';
import * as db from "firebase/database";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';

import { ADD_DATE_KEY, SET_TIME } from "../views/dailyplanner_view/context/dailyplanner-actions";
import { DATE_KEYS_PATH, DAILYBIGS_PATH, NOTES_PATH, ROUTINES_PATH, TASKS_PATH, TIME_PATH, DATE_SAVE_LOCATION, LOCATION_PATH, EXPORTS_DIR_NAME } from "./constants";


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
      return snapshot.val() || {};
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


export const loadAllDateKeys = async () => {
  try {
    const snapshot = await db.get(db.ref(appDb, DATE_KEYS_PATH));
    if (snapshot.exists()) {
      return Object.keys(snapshot.val() || {});
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


export const updateRoutine = (date, routineIndex, newData) => {
  const dateKey = getDbDateKey(date);

  db.set(db.ref(appDb, `${dateKey}/${ROUTINES_PATH}/${routineIndex}/`), newData).catch((err) => {
    console.warn("Firebase write restricted (demo mode or offline):", err?.message || err);
  });
}


export const updateDailyBig = (date, dailyBigIndex, newData) => {
  const dateKey = getDbDateKey(date);

  db.set(db.ref(appDb, `${dateKey}/${DAILYBIGS_PATH}/${dailyBigIndex}/`), newData).catch((err) => {
    console.warn("Firebase write restricted (demo mode or offline):", err?.message || err);
  });
}


export const updateTask = (date, taskIndex, newData) => {
  const dateKey = getDbDateKey(date);

  db.set(db.ref(appDb, `${dateKey}/${TASKS_PATH}/${taskIndex}/`), newData).catch((err) => {
    console.warn("Firebase write restricted (demo mode or offline):", err?.message || err);
  });
}


export const updateNotes = (date, newNotes) => {
  const dateKey = getDbDateKey(date);

  db.set(db.ref(appDb, `${dateKey}/${NOTES_PATH}/`), newNotes).catch((err) => {
    console.warn("Firebase write restricted (demo mode or offline):", err?.message || err);
  });
}


export const initDate = async (date, time, dispatch) => {
  // Save time if not already saved for that date, and anything else that needs to happen only once when date is first used.
  // This is called on routine, daily big, task, or notes change.
  const dateKey = getDbDateKey(date);

  if (time === "") {
    const newDate = new Date();
    const newTime = `${newDate.getHours()}:${newDate.getMinutes()}`;

    try {
      await db.set(db.ref(appDb, `${dateKey}/${TIME_PATH}/`), newTime);
      dispatch({ type: SET_TIME, payload: newTime });  // Update locally to make time visible.

      // Add the dateKey to the db, this is used to add dots to the populated dates in the date picker.
      const dateKeysRef = db.ref(appDb, `${DATE_KEYS_PATH}/${dateKey}`);
      const newDateKeyRef = db.push(dateKeysRef);

      await db.set(newDateKeyRef, dateKey);
      dispatch({ type: ADD_DATE_KEY, payload: dateKey });

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
    }
  }
}


export const updateTime = (date, newTime) => {
  const dateKey = getDbDateKey(date);

  db.set(db.ref(appDb, `${dateKey}/${TIME_PATH}/`), newTime).catch((err) => {
    console.warn("Firebase write restricted (demo mode or offline):", err?.message || err);
  });
}


export const exportDb = async (setExportSnackbar) => {
  const dbData = await db.get(db.ref(appDb, "/")).then((snapshot) => {
    if (snapshot.exists()) {
      const dbData = snapshot.val();

      return dbData;
    } else {
      return {}
    }
  }).catch((error) => {
    console.warn("Firebase export failed (demo mode or offline):", error?.message || error);
    return null;
  })

  if (!dbData) return;

  const dbDataJsonString = JSON.stringify(dbData, null, 2);

  const dt = new Date();
  const nowDateTimeString =
    `${dt.getDate()}-${dt.getMonth() + 1}-${dt.getFullYear()}_${dt.getHours()}-${dt.getMinutes()}-${dt.getSeconds()}`

  const fileName = `db_${nowDateTimeString}.json`;

  await saveDataToFile(fileName, dbDataJsonString);
  setExportSnackbar(true);
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


export const importDb = (setImportSnackbar) => {
  const input = document.createElement("input");
  input.type = "file";

  input.onchange = (e) => {
    const file = e.target.files[0];

    const reader = new FileReader();
    reader.readAsText(file, "UTF-8");

    reader.onload = (readerEvent) => {
      const content = readerEvent.target.result;
      const json = JSON.parse(content)
      db.set(db.ref(appDb, "/"), json).catch((err) => {
        console.warn("Firebase write restricted (demo mode or offline):", err?.message || err);
      });
      setImportSnackbar(true);
    }
  }

  input.click();
}


export const deleteDb = () => {
  db.set(db.ref(appDb, "/"), null).catch((err) => {
    console.warn("Firebase write restricted (demo mode or offline):", err?.message || err);
  });
}


export const checkConnectionStatus = (setOffline) => {
  if (!hasFirebaseConfig) {
    setOffline(false);
    return () => {};
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