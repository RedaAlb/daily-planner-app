import React, { useEffect, useState } from "react";

import { Checkbox } from "@mui/material";


function Tickbox(props) {
  const [checkedIconIndex, setCheckedIconIndex] = useState(props.checkIndex);


  const onClick = () => {
    var newCheckIndex = checkedIconIndex + 1;

    if (newCheckIndex === 3) {
      newCheckIndex = 0;
    }

    setCheckedIconIndex(newCheckIndex);
    props.onClick(newCheckIndex);
  }


  useEffect(() => {
    setCheckedIconIndex(props.checkIndex);
  }, [props.checkIndex])


  return (
    <Checkbox
      checked={false}
      onClick={onClick}
      icon={props.icons[checkedIconIndex]}
      sx={props.style}
    />
  )
}

export default Tickbox;