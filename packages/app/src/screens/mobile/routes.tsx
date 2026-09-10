import { Navigate, Route, Routes, useLocation } from "react-router";
import { useMobileNavigation } from "../../modules/navigation/use-mobile-navigation";
import About from "./about";
import Settings from "./settings";
import GeneralSettings from "./general-settings";
import NotificationSettings from "./notifications";
import HijriDateSettings from "./hijri-date-settings";
import { AnimatePresence } from "framer-motion";
import Search from "./search";
import { NotFound } from "../../modules/components/not-found";
import { Today } from "./today";
import WipeData from "./wipe-data";
import SyncPage from "./sync";
import Subscription from "./subscription";
import { Inbox } from "./inbox";
import { Completed } from "./completed";
import { Recurring } from "./recurring";
import SignInPage from "./signin";
import SignUpPage from "./signup";
import VerifyEmailPage from "./verify-email";
import { HijriCalendar } from "./hijri-calendar";
import Profile from "./profile";
import Browse from "./browse";
import TagDetailPage from "./tag-detail-page";
import LayoutMobile from "./layout-mobile";
import UpcomingMobile from "./upcoming";
import MobileTaskFormProvider from "./task-form-provider";

export const RoutesMobile = () => {
  const location = useLocation();
  useMobileNavigation();

  return (
    <MobileTaskFormProvider>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route element={<LayoutMobile />}>
            <Route index element={<Navigate to="/today" replace />} />
            <Route path="search" element={<Search />} />
            <Route path="today" element={<Today />} />
            <Route path="upcoming" element={<UpcomingMobile />} />
            <Route path="inbox" element={<Inbox />} />
            <Route path="recurring" element={<Recurring />} />
            <Route path="completed" element={<Completed />} />
            <Route path="browse" element={<Browse />} />
            <Route path="tags/:tagName" element={<TagDetailPage />} />
          </Route>
          <Route path="settings" element={<Settings />} />
          <Route path="about" element={<About />} />
          <Route path="wipe-local" element={<WipeData />} />
          <Route path="signin" element={<SignInPage />} />
          <Route path="signin/:action" element={<SignInPage />} />
          <Route path="signup" element={<SignUpPage />} />
          <Route path="signup/:action" element={<SignUpPage />} />
          <Route path="verify-email" element={<VerifyEmailPage />} />
          <Route path="sync" element={<SyncPage />} />
          <Route path="settings/general" element={<GeneralSettings />} />
          <Route
            path="settings/notifications"
            element={<NotificationSettings />}
          />
          <Route path="settings/hijri-date" element={<HijriDateSettings />} />
          <Route path="settings/subscription" element={<Subscription />} />
          <Route path="hijri-calendar" element={<HijriCalendar />} />
          <Route path="profile" element={<Profile />} />
          <Route path="profile/:action" element={<Profile />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AnimatePresence>
    </MobileTaskFormProvider>
  );
};
