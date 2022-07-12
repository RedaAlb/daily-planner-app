import React, { useState } from "react";

import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { MobileDateTimePicker } from '@mui/x-date-pickers/MobileDateTimePicker';

import TextField from '@mui/material/TextField';
import { Fab } from "@mui/material";
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';


function DateNavigation(props) {
  const [currentDate, setCurrentDate] = useState(new Date());


  const onDateChange = (date) => {
    setCurrentDate(date);
  }


  const onNextDayClick = () => {
    const nextDay = new Date(currentDate);
    nextDay.setDate(nextDay.getDate() + 1);

    setCurrentDate(nextDay);
  }


  const onPreviousDayClick = () => {
    const prevDay = new Date(currentDate);
    prevDay.setDate(prevDay.getDate() - 1);

    setCurrentDate(prevDay);
  }


  return (
    <>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <MobileDateTimePicker
          label=""
          inputFormat="dd MMMM yyyy | EEEE HH:mm"
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