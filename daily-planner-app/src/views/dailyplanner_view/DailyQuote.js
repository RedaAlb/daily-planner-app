import React from "react";

import { DEFAULT_VERT_GAP } from "../../utils/constants";


function DailyQuote(props) {
  const quote = "All you have to do everyday, is to simply tick off tasks, as there is nothing that you cannot do just by simply doing it.";
  const author = "";


  return (
    <div
      style={{
        marginTop: DEFAULT_VERT_GAP,
        background: "#fff1e0",
        padding: "10px",
        borderRadius: "5px",
        textAlign: "justify"
      }}>
      <q>{quote}</q>
      <span style={{ float: "right", fontStyle: "italic" }}>
        {author === "" ? null : `- ${author}`}
      </span>
    </div>
  )
}

export default DailyQuote;