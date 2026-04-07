import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useNavigationType,
} from "react-router";
import Layout from "./layout";
import About from "./modules/settings/about";
import Settings from "./modules/settings/pages/settings";
import {
  SettingsModal,
  defaultSettingsSections,
  type SettingsSection,
} from "./modules/components/settings-layout";
import { useScreenSize } from "./modules/components/screen-size-wrapper";
import GeneralSettings from "./modules/settings/pages/general-settings";
import { AnimatePresence } from "framer-motion";
import Tasks from "./modules/task/tasks";
import { NotFound } from "./modules/components/not-found";
import { Today } from "./modules/task/today";
import WipeData from "./modules/settings/wipe-data";
import ListDetail from "./modules/task/list-detail";
import Upcoming from "./modules/task/upcoming";
import SyncPage from "./modules/sync/sync";
import Onboarding from "./modules/onboarding/onboarding";
import { OnboardingGuard } from "./modules/onboarding/onboarding-guard";
import SignInPage from "./modules/auth/pages/signin";
import SignUpPage from "./modules/auth/pages/signup";
import { HijriCalendar } from "./modules/calendar/hijri-calendar";
import Profile from "./modules/settings/pages/profile";
import PrayerTimeFallback from "./modules/settings/pages/prayer-time-fallback";
import { Inbox } from "./modules/task/inbox";
import Browse from "./modules/task/browse";

const desktopSettingsSections: SettingsSection[] = [
  {
    ...defaultSettingsSections.find((s) => s.id === "account")!,
    path: "/profile",
  },
  {
    ...defaultSettingsSections.find((s) => s.id === "general")!,
    path: "/settings/general",
  },
  {
    ...defaultSettingsSections.find((s) => s.id === "prayer-time-fallback")!,
    path: "/settings/prayer-time-fallback",
  },
  {
    ...defaultSettingsSections.find((s) => s.id === "sync")!,
    path: "/sync",
  },
  {
    ...defaultSettingsSections.find((s) => s.id === "reset")!,
    path: "/wipe-local",
  },
  {
    ...defaultSettingsSections.find((s) => s.id === "about")!,
    path: "/about",
  },
];

export const AppRoutes = () => {
  // https://blog.logrocket.com/building-react-modal-module-with-react-router/
  const location = useLocation();
  const navigate = useNavigate();
  const { isDesktop } = useScreenSize();
  const settingsBackgroundLocation = location.state?.settingsBackgroundLocation;
  const isSettingsOpen = isDesktop && !!settingsBackgroundLocation;
  return (
    <>
      {/* Note that animate present depends to the useLocation hook so it should be here */}
      <AnimatePresence mode="wait">
        <Routes
          location={settingsBackgroundLocation || location}
          key={
            isSettingsOpen
              ? settingsBackgroundLocation.pathname
              : location.pathname
          }
        >
          <Route path="onboarding" element={<Onboarding />} />
          <Route
            element={
              <OnboardingGuard>
                <Layout />
              </OnboardingGuard>
            }
          >
            <Route index element={<Today />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="upcoming" element={<Upcoming />} />
            <Route path="inbox" element={<Inbox />} />
            {!isDesktop && <Route path="browse" element={<Browse />} />}
            <Route path="list/:listId" element={<ListDetail />} />
          </Route>
          {!isDesktop && <Route path="settings" element={<Settings />} />}
          <Route path="about" element={<About />} />
          <Route path="wipe-local" element={<WipeData />} />
          <Route path="signin" element={<SignInPage />} />
          <Route path="signin/:action" element={<SignInPage />} />
          <Route path="signup" element={<SignUpPage />} />
          <Route path="signup/:action" element={<SignUpPage />} />
          <Route path="sync" element={<SyncPage />} />
          <Route path="settings/general" element={<GeneralSettings />} />
          <Route
            path="settings/prayer-time-fallback"
            element={<PrayerTimeFallback />}
          />
          <Route path="hijri-calendar" element={<HijriCalendar />} />
          <Route path="profile" element={<Profile />} />
          <Route path="profile/:action" element={<Profile />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AnimatePresence>
      {isSettingsOpen && (
        <SettingsModal
          sections={desktopSettingsSections}
          isOpen={true}
          onClose={() =>
            navigate(settingsBackgroundLocation.pathname, { replace: true })
          }
        >
          <Routes>
            <Route path="settings/general" element={<GeneralSettings />} />
            <Route
              path="settings/prayer-time-fallback"
              element={<PrayerTimeFallback />}
            />
            <Route path="profile" element={<Profile />} />
            <Route path="profile/:action" element={<Profile />} />
            <Route path="sync" element={<SyncPage />} />
            <Route path="hijri-calendar" element={<HijriCalendar />} />
            <Route path="wipe-local" element={<WipeData />} />
            <Route path="about" element={<About />} />
          </Routes>
        </SettingsModal>
      )}
    </>
  );
};
