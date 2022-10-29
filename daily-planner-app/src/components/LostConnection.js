import React, { useEffect, useState } from "react";

import { Backdrop, CircularProgress } from "@mui/material";

import { checkConnectionStatus } from "../utils/Firebase";


function LostConnection(props) {
  const [offline, setOffline] = useState(true);


  useEffect(() => {
    checkConnectionStatus(setOffline);
  }, [])


  return (
    <Backdrop
      sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
      open={offline}
    >
      <CircularProgress color="inherit" sx={{ marginRight: "10px" }} />
      <p>No internet connection...</p>
    </Backdrop>
  )
}

export default LostConnection;