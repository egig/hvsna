import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router";
import Layout from "./layout";
import About from "./about";
import { SettingsModal, defaultSettingsSections } from "./settings-layout";
import GeneralSettings from "./general-settings";
import NotificationSettings from "./notifications";
import HijriDateSettings from "./hijri-date-settings";
import Search from "./search";
import { NotFound } from "@/modules/components/not-found";
import { Today } from "./today";
import WipeData from "./wipe-data";
import { Inbox } from "./inbox";
import { Completed } from "./completed";
import { Recurring } from "./recurring";
import SignInPage from "./signin";
import { SignInView } from "@/modules/auth/pages/signin-view";
import SignUpPage from "./signup";
import VerifyEmailPage from "./verify-email";
import { HijriCalendar } from "./hijri-calendar";
import Profile from "./profile";
import TagDetailPage from "./tag-detail-page";
import Sync from "./sync";
import Subscription from "./subscription";
import UpcomingDesktop from "./upcoming";
import DesktopTaskFormProvider from "./task-form-provider";

/**
 * Settings lives in a modal layered over the app. Sidebar links carry the
 * current location as `settingsBackgroundLocation` state; a direct hit or a
 * reload has no such state, so we fall back to `/today` as the backdrop and
 * still open the modal.
 */
const SETTINGS_PATHS = [
  "/settings/general",
  "/settings/notifications",
  "/settings/hijri-date",
  "/settings/subscription",
  "/profile",
  "/sync",
  "/hijri-calendar",
  "/wipe-local",
  "/about",
];

const isSettingsPath = (pathname: string) =>
  SETTINGS_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

export const RoutesDesktop = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const backgroundLocation =
    location.state?.settingsBackgroundLocation ??
    (isSettingsPath(location.pathname) ? { pathname: "/today" } : null);
  const isSettingsOpen = !!backgroundLocation;

  return (
    <DesktopTaskFormProvider>
      {/* AnimatePresence depends on useLocation, so the router lives here. */}
      <Routes location={backgroundLocation || location}>
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
        <Route path="verify-email" element={<VerifyEmailPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>

      {isSettingsOpen && (
        <SettingsModal
          sections={defaultSettingsSections}
          isOpen={true}
          onClose={() =>
            navigate(backgroundLocation.pathname, { replace: true })
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
            <Route path="settings/subscription" element={<Subscription />} />
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
