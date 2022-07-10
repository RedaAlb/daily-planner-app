import { BrowserRouter as Router, Routes, Route } from "react-router-dom"

import DailyPlannerView from "./views/dailyplanner_view/DailyPlannerView";


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<DailyPlannerView />} />
        <Route path="*" element={<h1>No page found</h1>} />
      </Routes>
    </Router>
  )
}

export default App;