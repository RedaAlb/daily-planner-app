import React, { useContext, useEffect, useState } from "react";

import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { MobileDateTimePicker } from '@mui/x-date-pickers/MobileDateTimePicker';

import TextField from '@mui/material/TextField';
import { Fab } from "@mui/material";
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

import { updateTime } from "../utils/Firebase";

import dailyplannerContext from "../views/dailyplanner_view/context/dailyplanner-context";
import { SET_DATE } from "../views/dailyplanner_view/context/dailyplanner-actions";



function DateNavigation(props) {
  const { state, dispatch } = useContext(dailyplannerContext);

  const [currentDate, setCurrentDate] = useState(state.currentDate);


  const onDateChange = (date) => {
    dispatch({ type: SET_DATE, payload: date });
    updateTime(currentDate, `${date.getHours()}:${date.getMinutes()}`);
  }


  const onNextDayClick = () => {
    const nextDay = new Date(state.currentDate);
    nextDay.setDate(nextDay.getDate() + 1);

    dispatch({ type: SET_DATE, payload: nextDay });
  }


  const onPreviousDayClick = () => {
    const prevDay = new Date(state.currentDate);
    prevDay.setDate(prevDay.getDate() - 1);

    dispatch({ type: SET_DATE, payload: prevDay });
  }


  useEffect(() => {
    if (state.time === "") {
      setCurrentDate(state.currentDate);
    } else {
      const updatedDate = new Date(state.currentDate);

      const timeSplit = state.time.split(":");
      updatedDate.setHours(timeSplit[0]);
      updatedDate.setMinutes(timeSplit[1]);
      setCurrentDate(updatedDate);
    }
  }, [state.currentDate, state.time])


  return (
    <>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <MobileDateTimePicker
          label=""
          inputFormat={"dd MMMM yyyy | EEEE" + (state.time !== '' ? " HH:mm" : "")}
          ampm={false}
          value={currentDate}
          onChange={onDateChange}
          renderInput={(params) =>
            <TextField fullWidth  {...params} />
          }
        />
      </LocalizationProvider>

      <Fab
        onClick={onNextDayClick}
        color="primary"
        size="large"
        sx={{ position: "fixed", bottom: 26, right: 26 }}
      >
        <ChevronRightIcon fontSize="large" />
      </Fab>

      <Fab
        onClick={onPreviousDayClick}
        color="primary"
        size="large"
        sx={{ position: "fixed", bottom: 26, right: 100 }}
      >
        <ChevronLeftIcon fontSize="large" />
      </Fab>
    </>
  )
}

export default DateNavigation;