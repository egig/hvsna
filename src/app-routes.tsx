import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigationType,
} from "react-router";
import MonthView from "./pages/view-month";
import YearView from "./pages/view-year";
import TabLayout from "./layouts/tab-layout";
import About from "./pages/about";
import Settings from "./pages/settings";
import GeneralSettings from "./pages/general-settings";
import { AnimatePresence } from "framer-motion";
import Tasks from "./modules/task/tasks";
import Logs from "./modules/log/logs";
import Trackers from "./modules/tracker/trackers";
import TrackersAttributes from "./modules/attribute/tracker-attributes";
import AttributeOptions from "./modules/option/options";
import { Goals } from "./modules/goal/goals";
import { Today } from "./components/today";
import DataManagement from "./pages/data-management";
import TrackerDetail from "./modules/tracker/tracker-detail";
import Browse from "./pages/browse";
import Upcoming from "./pages/upcoming";
import SignInPage from "./pages/signin";
import SignUpPage from "./pages/signup";
import SyncPage from "./pages/sync";

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
          <Route index element={<Today />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="upcoming" element={<Upcoming />} />
          <Route path="about" element={<About />} />
          <Route path="wipe-local" element={<DataManagement />} />
          <Route path="y/:year/m/:month" element={<MonthView />} />
          <Route path="y/:year" element={<YearView />} />
          <Route path="goals" element={<Goals />} />
          <Route path="browse" element={<Browse />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="signin" element={<SignInPage />} />
        <Route path="signin/:action" element={<SignInPage />} />
        <Route path="signup" element={<SignUpPage />} />
        <Route path="sync" element={<SyncPage />} />
        <Route path="trackers" element={<Trackers />} />
        <Route path="trackers/:trackerId" element={<TrackerDetail />} />
        <Route path="trackers-attributes" element={<TrackersAttributes />} />
        <Route path="attribute-options" element={<AttributeOptions />} />
        <Route path="logs" element={<Logs />} />
        <Route path="general-settings" element={<GeneralSettings />} />
        <Route path="*" element={<p>Not Found</p>} />
      </Routes>
    </AnimatePresence>
  );
};
