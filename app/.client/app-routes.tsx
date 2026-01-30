import { Navigate, Route, Routes, useLocation } from "react-router";
import Home from "./pages/view-today";
import MonthView from "./pages/view-month";
import YearView from "./pages/view-year";
import TabLayout from "./pages/tab-layout";
import About from "./pages/about";
import TrackersPage from "./pages/trackers";
import TargetsPage from "./pages/targets";
import Settings from "./pages/settings";
import Tasks from "./pages/tasks";
import Journal from "./pages/journal";
import { AnimatePresence } from "framer-motion";

export const AppRoutes = () => {
  // https://blog.logrocket.com/building-react-modal-module-with-react-router/
  const location = useLocation();
  const settingsBackgroundLocation = location.state?.settingsBackgroundLocation;
  return (
    // Note that animate present depends to the useLocation hook so it should be here
    <AnimatePresence mode="wait">
      <Routes
        location={settingsBackgroundLocation || location}
        key={location.pathname}
      >
        <Route element={<TabLayout />}>
          <Route index element={<Home />} />
          <Route path="settings" element={<Settings />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="targets" element={<TargetsPage />} />
          <Route path="journal" element={<Journal />} />
          <Route path="about" element={<About />} />
          <Route path="y/:year/m/:month" element={<MonthView />} />
          <Route path="y/:year" element={<YearView />} />
        </Route>
        <Route path="trackers" element={<TrackersPage />} />
      </Routes>
      <Routes>
        {/* <Route path="settings" element={<div>Settings</div>} /> */}
        {/* <Route path="*" element={<div />} /> */}
      </Routes>
    </AnimatePresence>
  );
};
