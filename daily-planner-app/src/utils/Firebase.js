import { initializeApp } from 'firebase/app';
import * as db from "firebase/database";

import { SET_TIME } from "../views/dailyplanner_view/context/dailyplanner-actions";
import { DAILYBIGS_PATH, NOTES_PATH, ROUTINES_PATH, TASKS_PATH, TIME_PATH } from "./constants";


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


export const setTime = (date, time, dispatch) => {
  // Init time if not already saved for that date.
  // This is called on routine, daily big, task, or notes change.
  const dateKey = getDbDateKey(date);

  if (time === "") {
    const newDate = new Date();
    const newTime = `${newDate.getHours()}:${newDate.getMinutes()}`;
    dispatch({ type: SET_TIME, payload: newTime });  // Update locally to make time visible.

    db.set(db.ref(appDb, `${dateKey}/${TIME_PATH}/`), newTime);
  }
}


export const updateTime = (date, newTime) => {
  const dateKey = getDbDateKey(date);

  db.set(db.ref(appDb, `${dateKey}/${TIME_PATH}/`), newTime);
}