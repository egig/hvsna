import { Navigate, Route, Routes, useLocation } from "react-router";
import MonthView from "./pages/view-month";
import YearView from "./pages/view-year";
import TabLayout from "./layouts/tab-layout";
import About from "./pages/about";
import Settings from "./pages/settings";
import { AnimatePresence } from "framer-motion";
import Tasks from "./modules/task/tasks";
import Logs from "./modules/log/logs";
import Trackers from "./modules/tracker/trackers";
import Targets from "./modules/target/targets";
import TrackersAttributes from "./modules/attribute/tracker-attributes";
import AttributeOptions from "./modules/option/options";
import { TargetResults } from "./components/TargetResults";
import { Home } from "./components/Home";
import DataManagement from "./pages/data-management";
import TrackerDetail from "./modules/tracker/tracker-detail";

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
          <Route path="results" element={<TargetResults />} />
          <Route path="logs" element={<Logs />} />
          <Route path="about" element={<About />} />
          <Route path="wipe-local" element={<DataManagement />} />
          <Route path="y/:year/m/:month" element={<MonthView />} />
          <Route path="y/:year" element={<YearView />} />
        </Route>
        <Route path="trackers" element={<Trackers />} />
        <Route path="trackers/:trackerId" element={<TrackerDetail />} />
        <Route path="trackers-attributes" element={<TrackersAttributes />} />
        <Route path="attribute-options" element={<AttributeOptions />} />
        <Route path="targets" element={<Targets />} />
      </Routes>
      <Routes>
        {/* <Route path="settings" element={<div>Settings</div>} /> */}
        {/* <Route path="*" element={<div />} /> */}
      </Routes>
    </AnimatePresence>
  );
};
