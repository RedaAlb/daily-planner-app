import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { ARCHIVED_TASKS_VIEW_PATH, GLOBAL_TASKS_VIEW_PATH, GYM_WEIGHTS_VIEW_PATH, SETTINGS_VIEW_PATH, TASKS_VIEW_PATH } from "./utils/constants";

import DailyPlannerView from "./views/dailyplanner_view/DailyPlannerView";
import SettingsView from "./views/settings_view/SettingsView";
import GlobalTasksView from "./views/global_tasks/GlobalTasksView";
import ArchivedTasksView from "./views/archived_tasks/ArchivedTasksView";
import GymWeightsView from "./views/gymweights_view/GymWeightsView";
import TasksView from "./views/tasks_view/TasksView";

import BottomNav from "./components/BottomNav";

import { AuthProvider } from "./context/AuthContext";


function App() {
  return (
    <AuthProvider>
      <Router>
        <div style={{ paddingBottom: "56px" }}>
          <Routes>
            <Route path="/" element={<DailyPlannerView />} />
            <Route path={TASKS_VIEW_PATH} element={<TasksView />} />
            <Route path={GLOBAL_TASKS_VIEW_PATH} element={<GlobalTasksView />} />
            <Route path={GYM_WEIGHTS_VIEW_PATH} element={<GymWeightsView />} />
            <Route path={ARCHIVED_TASKS_VIEW_PATH} element={<ArchivedTasksView />} />
            <Route path={SETTINGS_VIEW_PATH} element={<SettingsView />} />
            <Route path="*" element={<h1>No page found</h1>} />
          </Routes>
        </div>
        <BottomNav />
      </Router>
    </AuthProvider>
  )
}

export default App;