import { initializeApp } from 'firebase/app';
import * as db from "firebase/database";


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
      console.log("Loaded date");

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


const getDbDateKey = (date) => {
  const dateKey = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;

  return dateKey;
}