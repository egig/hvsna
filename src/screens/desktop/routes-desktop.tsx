import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router";
import Layout from "./layout";
import About from "../../modules/settings/about";
import {
  SettingsModal,
  defaultSettingsSections,
  type SettingsSection,
} from "./settings-layout";
import GeneralSettings from "../../modules/settings/pages/general-settings";
import NotificationSettings from "../../modules/settings/pages/notifications";
import HijriDateSettings from "../../modules/settings/pages/hijri-date-settings";
import Search from "../../modules/task/search";
import { NotFound } from "../../modules/components/not-found";
import { Today } from "../../modules/task/today";
import WipeData from "../../modules/settings/wipe-data";
import SyncPage from "../../modules/sync/sync";
import { Inbox } from "../../modules/task/inbox";
import { Completed } from "../../modules/task/completed";
import { Recurring } from "../../modules/task/recurring";
import SignInPage from "../../modules/auth/pages/signin";
import { SignInView } from "../../modules/auth/pages/signin-view";
import SignUpPage from "../../modules/auth/pages/signup";
import { HijriCalendar } from "../../modules/calendar/hijri-calendar";
import Profile from "../../modules/settings/pages/profile";
import TagDetailPage from "../../modules/task/tag-detail-page";
import Sync from "../../modules/sync/sync";
import UpcomingDesktop from "./upcoming";
import DesktopTaskFormProvider from "./task-form-provider";

export const RoutesDesktop = () => {
  // https://blog.logrocket.com/building-react-modal-module-with-react-router/
  const location = useLocation();
  const navigate = useNavigate();
  const settingsBackgroundLocation = location.state?.settingsBackgroundLocation;
  const isSettingsOpen = !!settingsBackgroundLocation;
  return (
    <DesktopTaskFormProvider>
      {/* Note that animate present depends to the useLocation hook so it should be here */}
      <Routes
        location={settingsBackgroundLocation || location}
        key={
          isSettingsOpen
            ? settingsBackgroundLocation.pathname
            : location.pathname
        }
      >
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/today" replace />} />
          <Route path="search" element={<Search />} />
          <Route path="today" element={<Today />} />
          <Route path="upcoming" element={<UpcomingDesktop />} />
          <Route path="inbox" element={<Inbox />} />
          <Route path="recurring" element={<Recurring />} />
          <Route path="completed" element={<Completed />} />
          <Route path="tags/:tagName" element={<TagDetailPage />} />
        </Route>
        <Route path="signin" element={<SignInPage />} />
        <Route path="signin/:action" element={<SignInPage />} />
        <Route path="signup" element={<SignUpPage />} />
        <Route path="signup/:action" element={<SignUpPage />} />
        <Route path="sync" element={<SyncPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {isSettingsOpen && (
        <SettingsModal
          sections={defaultSettingsSections}
          isOpen={true}
          onClose={() =>
            navigate(settingsBackgroundLocation.pathname, { replace: true })
          }
        >
          <Routes>
            <Route path="settings/general" element={<GeneralSettings />} />
            <Route
              path="settings/notifications"
              element={<NotificationSettings />}
            />
            <Route path="settings/hijri-date" element={<HijriDateSettings />} />
            <Route path="profile" element={<Profile />} />
            <Route path="profile/:action" element={<Profile />} />
            <Route path="sync" element={<Sync />} />
            <Route path="hijri-calendar" element={<HijriCalendar />} />
            <Route path="wipe-local" element={<WipeData />} />
            <Route path="about" element={<About />} />
            <Route path="signin" element={<SignInView />} />
          </Routes>
        </SettingsModal>
      )}
    </DesktopTaskFormProvider>
  );
};
