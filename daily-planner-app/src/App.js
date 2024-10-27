import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { GLOBAL_TASKS_VIEW_PATH, SETTINGS_VIEW_PATH } from "./utils/constants";

import DailyPlannerView from "./views/dailyplanner_view/DailyPlannerView";
import SettingsView from "./views/settings_view/SettingsView";
import GlobalTasksView from "./views/global_tasks/GlobalTasksView";


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<DailyPlannerView />} />
        <Route path={GLOBAL_TASKS_VIEW_PATH} element={<GlobalTasksView />} />
        <Route path={SETTINGS_VIEW_PATH} element={<SettingsView />} />
        <Route path="*" element={<h1>No page found</h1>} />
      </Routes>
    </Router>
  )
}

export default App;