import * as actions from "./dailyplanner-actions";
import * as constants from "../../../utils/constants";


const dailyplannerReducer = (state, action) => {
  switch (action.type) {
    case actions.SET_DATE: {
      return { ...state, currentDate: action.payload };
    }


    case actions.SET_TIME: {
      if (typeof action.payload === "undefined") {
        return { ...state, time: constants.DEFAULT_TIME };
      } else {
        return { ...state, time: action.payload };
      }
    }


    case actions.SET_ROUTINES: {
      if (typeof action.payload === "undefined") {
        return { ...state, routines: getNewState(constants.DEFAULT_ROUTINES) };
      } else {
        const newRoutines = updateNewStateArray(constants.DEFAULT_ROUTINES, action.payload);

        return { ...state, routines: newRoutines };
      }
    }


    case actions.SET_DAILYBIGS: {
      if (typeof action.payload === "undefined") {
        return { ...state, dailyBigs: getNewState(constants.DEFAULT_DAILY_BIGS) };
      } else {
        const newDailyBigs = updateNewStateArray(constants.DEFAULT_DAILY_BIGS, action.payload);

        return { ...state, dailyBigs: newDailyBigs };
      }
    }


    case actions.SET_TASKS: {
      if (typeof action.payload === "undefined") {
        return { ...state, tasks: getNewState(constants.DEFAULT_TASKS) }
      } else {
        const newTasks = updateNewStateArray(constants.DEFAULT_TASKS, action.payload);

        return { ...state, tasks: newTasks };
      }
    }


    case actions.SET_NOTES: {
      if (typeof action.payload === "undefined") {
        return { ...state, notes: constants.DEFAULT_NOTES };
      } else {
        return { ...state, notes: action.payload };
      }
    }


    default:
      throw new Error(`No case for action type ${action.type} in dailyplanner reducer.`);
  }
}


const updateNewStateArray = (stateArray, changes) => {
  // Deep copy is needed here so changes stay specific to each date view, including empty values.
  var newArray = stateArray.map(obj => { return { ...obj } });

  for (const [key, change] of Object.entries(changes)) {
    const index = parseInt(key);
    newArray[index] = change;
  }

  return newArray;
}


const getNewState = (state) => {
  // Deep copy is needed so data gets reset on date change.
  return state.map(obj => { return { ...obj } });
}


export default dailyplannerReducer;