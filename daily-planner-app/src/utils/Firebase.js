import { initializeApp } from 'firebase/app';
import * as db from "firebase/database";

import { Capacitor } from '@capacitor/core';
import { Storage } from '@capacitor/storage';
import { Geolocation } from '@capacitor/geolocation';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

import { ADD_DATE_KEY, SET_TIME } from "../views/dailyplanner_view/context/dailyplanner-actions";
import { DATE_KEYS_PATH, DAILYBIGS_PATH, NOTES_PATH, ROUTINES_PATH, TASKS_PATH, TIME_PATH, DATE_SAVE_LOCATION, LOCATION_PATH, EXPORTS_DIR_NAME } from "./constants";


const firebaseConfig = {
  apiKey: process.env.REACT_APP_API_KEY,
  authDomain: process.env.REACT_APP_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_DATABASE_URL,
  projectId: process.env.REACT_APP_PROJECT_ID,
  storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_APP_ID
}


const app = initializeApp(firebaseConfig);
const appDb = db.getDatabase(app);
const dbRef = db.ref(appDb);

const platform = Capacitor.getPlatform();


export const loadDate = async (date) => {
  const dateKey = getDbDateKey(date);

  const dateData = await db.get(db.child(dbRef, `/${dateKey}/`)).then((snapshot) => {
    if (snapshot.exists()) {
      const dateData = snapshot.val();
      console.log("Loaded date data");

      return dateData;
    } else {
      console.log("No data available");
      return {}
    }
  }).catch((error) => {
    console.error(error);
  })

  return dateData;
}


export const getDbDateKey = (date, seperator = "-") => {
  const dateKey = `${date.getDate()}${seperator}${date.getMonth() + 1}${seperator}${date.getFullYear()}`;

  return dateKey;
}


export const deleteDateData = (date) => {
  const dateKey = getDbDateKey(date);

  db.remove(db.ref(appDb, `/${dateKey}`));
  db.remove(db.ref(appDb, `${DATE_KEYS_PATH}/${dateKey}`));
}


export const loadAllDateKeys = async () => {
  const dateKeys = await db.get(db.ref(appDb, DATE_KEYS_PATH)).then((snapshot) => {
    if (snapshot.exists()) {
      const dateKeys = Object.keys(snapshot.val());

      return dateKeys;
    } else {
      return []
    }
  }).catch((error) => {
    console.error(error);
  })

  return dateKeys;
}


export const updateRoutine = (date, routineIndex, newData) => {
  const dateKey = getDbDateKey(date);

  db.set(db.ref(appDb, `${dateKey}/${ROUTINES_PATH}/${routineIndex}/`), newData);
}


export const updateDailyBig = (date, dailyBigIndex, newData) => {
  const dateKey = getDbDateKey(date);

  db.set(db.ref(appDb, `${dateKey}/${DAILYBIGS_PATH}/${dailyBigIndex}/`), newData);
}


export const updateTask = (date, taskIndex, newData) => {
  const dateKey = getDbDateKey(date);

  db.set(db.ref(appDb, `${dateKey}/${TASKS_PATH}/${taskIndex}/`), newData);
}


export const updateNotes = (date, newNotes) => {
  const dateKey = getDbDateKey(date);

  db.set(db.ref(appDb, `${dateKey}/${NOTES_PATH}/`), newNotes);
}


export const initDate = async (date, time, dispatch) => {
  // Save time if not already saved for that date, and anything else that needs to happen only once when date is first used.
  // This is called on routine, daily big, task, or notes change.
  const dateKey = getDbDateKey(date);

  if (time === "") {
    const newDate = new Date();
    const newTime = `${newDate.getHours()}:${newDate.getMinutes()}`;

    db.set(db.ref(appDb, `${dateKey}/${TIME_PATH}/`), newTime);
    dispatch({ type: SET_TIME, payload: newTime });  // Update locally to make time visible.


    // Add the dateKey to the db, this is used to add dots to the populated dates in the date picker.
    const dateKeysRef = db.ref(appDb, `${DATE_KEYS_PATH}/${dateKey}`);
    const newDateKeyRef = db.push(dateKeysRef);

    db.set(newDateKeyRef, dateKey);
    dispatch({ type: ADD_DATE_KEY, payload: dateKey });


    // Save location if location setting is turned on.
    const { value } = await Storage.get({ key: DATE_SAVE_LOCATION });

    if (value !== null && value !== "false") {
      const position = await Geolocation.getCurrentPosition();

      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      const locationString = `${latitude} ${longitude}`;

      db.set(db.ref(appDb, `${dateKey}/${LOCATION_PATH}/`), locationString);
    }
  }
}


export const updateTime = (date, newTime) => {
  const dateKey = getDbDateKey(date);

  db.set(db.ref(appDb, `${dateKey}/${TIME_PATH}/`), newTime);
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
    console.error(error);
  })

  const dbDataJsonString = JSON.stringify(dbData, null, 2);

  const dt = new Date();
  const nowDateTimeString =
    `${dt.getDate()}-${dt.getMonth() + 1}-${dt.getFullYear()}_${dt.getHours()}-${dt.getMinutes()}-${dt.getSeconds()}`

  const fileName = `db_${nowDateTimeString}`;

  await saveDataToFile(fileName, dbDataJsonString);

  if (platform !== "web") {
    setExportSnackbar(true);
  }
}


export const saveDataToFile = async (fileName, dataToSave) => {
  if (platform === "web") {
    const element = document.createElement("a");
    const file = new Blob([dataToSave], {
      type: "text/plain;charset=utf-8"
    })

    element.href = URL.createObjectURL(file);
    element.download = fileName;
    element.click();
  }
  else {
    try {
      await Filesystem.writeFile({
        path: `${EXPORTS_DIR_NAME}/${fileName}.txt`,
        data: dataToSave,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      })

    } catch (e) {
      await Filesystem.mkdir({
        path: `${EXPORTS_DIR_NAME}`,
        directory: Directory.Documents,
      })
      console.log("Directory created in documents");

      // Call function again after creating the directory for the first time to save data.
      saveDataToFile(fileName, dataToSave);
    }
  }
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
      db.set(db.ref(appDb, "/"), json);
      setImportSnackbar(true);
    }
  }

  input.click();
}


export const deleteDb = () => {
  db.set(db.ref(appDb, "/"), null);
}


export const checkConnectionStatus = (setOffline) => {
  const connRef = db.ref(appDb, ".info/connected");

  db.onValue(connRef, (snapshot) => {
    if (snapshot.val() === true) {
      setOffline(false);
    } else {
      setOffline(true);
    }
  })
}