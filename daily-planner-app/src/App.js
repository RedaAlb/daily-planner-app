import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { SETTINGS_VIEW_PATH } from "./utils/constants";

import DailyPlannerView from "./views/dailyplanner_view/DailyPlannerView";
import SettingsView from "./views/settings_view/SettingsView";


function App() {
  return (
    <Router basename={process.env.PUBLIC_URL}>
      <Routes>
        <Route path="/" element={<DailyPlannerView />} />
        <Route path={SETTINGS_VIEW_PATH} element={<SettingsView />} />
        <Route path="*" element={<h1>No page found</h1>} />
      </Routes>
    </Router>
  )
}

export default App;