import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigationType,
} from "react-router";
import TabLayout from "./tab-layout";
import About from "./modules/common/about";
import Settings from "./modules/settings/pages/settings";
import GeneralSettings from "./modules/settings/pages/general-settings";
import { AnimatePresence } from "framer-motion";
import Tasks from "./modules/task/tasks";
import Logs from "./modules/log/logs";
import Trackers from "./modules/tracker/trackers";
import TrackersAttributes from "./modules/attribute/tracker-attributes";
import AttributeOptions from "./modules/option/options";
import { Goals } from "./modules/goal/goals";
import { Today } from "./modules/common/today";
import WipeData from "./modules/settings/wipe-data";
import TrackerDetail from "./modules/tracker/tracker-detail";
import Browse from "./modules/task/browse";
import Upcoming from "./modules/common/upcoming";
import SyncPage from "./modules/sync/sync";
import Onboarding from "./modules/onboarding/onboarding";
import { OnboardingGuard } from "./modules/onboarding/onboarding-guard";
import SignInPage from "./modules/auth/pages/signin";
import SignUpPage from "./modules/auth/pages/signup";
import MonthView from "./modules/calendar/month-view";
import YearView from "./ui/year-view";
import Profile from "./modules/settings/pages/profile";

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
        <Route path="onboarding" element={<Onboarding />} />
        <Route
          element={
            <OnboardingGuard>
              <TabLayout />
            </OnboardingGuard>
          }
        >
          <Route index element={<Today />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="upcoming" element={<Upcoming />} />
          <Route path="goals" element={<Goals />} />
          <Route path="browse" element={<Browse />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="about" element={<About />} />
        <Route path="wipe-local" element={<WipeData />} />
        <Route path="signin" element={<SignInPage />} />
        <Route path="signin/:action" element={<SignInPage />} />
        <Route path="signup" element={<SignUpPage />} />
        <Route path="signup/:action" element={<SignUpPage />} />
        <Route path="sync" element={<SyncPage />} />
        <Route path="trackers" element={<Trackers />} />
        <Route path="trackers/:trackerId" element={<TrackerDetail />} />
        <Route path="trackers-attributes" element={<TrackersAttributes />} />
        <Route path="attribute-options" element={<AttributeOptions />} />
        <Route path="logs" element={<Logs />} />
        <Route path="general-settings" element={<GeneralSettings />} />
        <Route path="profile" element={<Profile />} />
        <Route path="profile/:action" element={<Profile />} />
        <Route path="*" element={<p>Not Found</p>} />
      </Routes>
    </AnimatePresence>
  );
};
