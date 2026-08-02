import React from "react";

import "../../css/global-tasks-view.css";

import GlobalTasksTopbar from "./GlobalTasksTopbar";
import OrderedList from "../../components/OrderedList";

function GlobalTasksView(props) {
  return (
    <div className="daily-planner-view">
      <GlobalTasksTopbar />

      <div className="daily-planner-content">
        <div className="global-notes">
          <OrderedList />
        </div>
      </div>
    </div>
  )
}

export default GlobalTasksView;