import React from "react";

import { Fab } from "@mui/material";
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';


function DateNavigation(props) {
  const onNextDayClick = () => {
    console.log("Next day");
  }


  const onPreviousDayClick = () => {
    console.log("Previous day");
  }


  return (
    <>
      <div>
        10 July 2022 10/7/22 Sunday 17:28
      </div>

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