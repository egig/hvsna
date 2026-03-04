import { Outlet } from "react-router";
import {
  SettingsLayout,
  defaultSettingsSections,
  type SettingsSection,
} from "../../../ui/settings-layout";

// Define sections with their paths
const settingsSections: SettingsSection[] = defaultSettingsSections.map(
  (section) => ({
    ...section,
    path:
      section.id === "general"
        ? "/settings/general"
        : section.id === "account"
          ? "/profile"
          : section.id === "sync"
            ? "/sync"
            : section.id === "calendar"
              ? "/hijri-calendar"
              : section.id === "reset"
                ? "/wipe-local"
                : section.id === "about"
                  ? "/about"
                  : "",
  }),
);

export default function SettingsPage() {
  return (
    <SettingsLayout sections={settingsSections}>
      <Outlet />
    </SettingsLayout>
  );
}
