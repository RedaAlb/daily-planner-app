import React from "react";

import { MAIN_COLOUR, MAIN_LINE_HEIGHT, SECONDARY_FONT_SIZE } from "../../utils/constants";

import Title from "../../components/Title";


function DailyNotes(props) {
  return (
    <>
      <Title text="Notes" />
      <textarea
        style={{
          // background: "cyan",
          height: "100%",
          border: `${MAIN_LINE_HEIGHT} solid ${MAIN_COLOUR}`,
          borderTop: "none",
          fontSize: SECONDARY_FONT_SIZE
        }}
      />
    </>
  )
}

export default DailyNotes;