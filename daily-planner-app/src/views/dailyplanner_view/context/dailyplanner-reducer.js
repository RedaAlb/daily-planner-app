import * as actions from "./dailyplanner-actions";


const dailyplannerReducer = (state, action) => {
  switch (action.type) {

    case actions.LOAD_DATE: {
      return { ...state };
    }


    case actions.ADD_DATE: {
      return { ...state };
    }


    case actions.SET_DATE: {
      return { ...state, currentDate: action.payload };
    }


    default:
      throw new Error(`No case for action type ${action.type} in dailyplanner reducer.`);
  }
}

export default dailyplannerReducer;