import React from 'react';

import { DEFAULT_VERT_GAP, MAIN_COLOUR, MAIN_LINE_HEIGHT } from "../utils/constants";


function Title(props) {
  return (
    <div style={{
      marginTop: DEFAULT_VERT_GAP,
      color: MAIN_COLOUR,
      textTransform: "uppercase",
      fontWeight: 600,
      borderBottom: `${MAIN_LINE_HEIGHT} solid ${MAIN_COLOUR}`
    }}>
      {props.text}
    </div>
  )
}

export default Title;