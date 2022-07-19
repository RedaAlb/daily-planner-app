import React, { useContext, useEffect, useState } from "react";

import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { MobileDateTimePicker } from '@mui/x-date-pickers/MobileDateTimePicker';
import { PickersDay } from "@mui/x-date-pickers";

import { Badge, Fab } from "@mui/material";
import TextField from '@mui/material/TextField';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

import dailyplannerContext from "../views/dailyplanner_view/context/dailyplanner-context";
import { SET_DATE } from "../views/dailyplanner_view/context/dailyplanner-actions";

import { getDbDateKey, updateTime } from "../utils/Firebase";
import { DATEPICKER_DOT_COLOUR } from "../utils/constants";


function DateNavigation(props) {
  const { state, dispatch } = useContext(dailyplannerContext);

  const [currentDate, setCurrentDate] = useState(state.currentDate);

  const badgeContent = <div style={{ marginLeft: "30px", fontSize: "20px", color: DATEPICKER_DOT_COLOUR }}>•</div>;


  const onDateChange = (date) => {
    dispatch({ type: SET_DATE, payload: date });

    // Only save date time if date is already populated, i.e. if time created already exists.
    if (state.time !== "") {
      updateTime(currentDate, `${date.getHours()}:${date.getMinutes()}`);
    }
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
          renderDay={(date, _value, DayComponentProps) => {
            const dateIsPopulated = state.dateKeys.includes(getDbDateKey(date));
            const isMarked = !DayComponentProps.outsideCurrentMonth && dateIsPopulated;

            return (
              <Badge
                key={date.toString()}
                overlap="circular"
                badgeContent={isMarked ? badgeContent : undefined}
                anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
              >
                <PickersDay {...DayComponentProps} />
              </Badge>
            )
          }}
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