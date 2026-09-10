import {
  HvPanelLeftClose,
  HvUserRound,
  HvPanelLeft,
  HvCalendarMonth,
  HvCalendarMonthFilled,
  HvSettings,
  HvSettingsFilled,
  HvSearch,
  HvSquareRoundedPlusFilled,
  HvSquareCheck,
  HvSquareCheckFilled,
  HvSearchAlt,
  HvCalendarEvent,
  HvCalendarEventFilled,
  HvReplayCircle,
  HvReplayCircleFilled,
} from "@/modules/icons";
import { NavLink, useLocation } from "react-router";
import type { ReactNode } from "react";
import { SidebarTagsSection } from "../../modules/task/sidebar-tags-section";
import { Modal } from "./modal";
import { useLanguageContext } from "../../modules/i18n/LanguageContext";
import { useTaskContext } from "../../modules/task/task-context";
import { useTaskFormContext } from "../../modules/task/task-form-context";
import { useState } from "react";
import { useAuth } from "../../modules/auth/use-auth";

interface DesktopSidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface SidebarTab {
  path: string;
  label: string;
  icon: ReactNode;
  activeIcon: ReactNode;
  context: string;
}

const navLinkClass = (isActive: boolean, collapsed: boolean) =>
  `flex text-[var(--hvsna-primary-color)] items-center w-full px-3 py-2 rounded-lg transition-colors ${
    collapsed ? "justify-center" : "space-x-1"
  } ${isActive ? "bg-gray-200" : "hover:bg-gray-200"}`;

function SidebarNavLink({
  tab,
  collapsed,
  extraState,
}: {
  tab: SidebarTab;
  collapsed: boolean;
  extraState?: Record<string, unknown>;
}) {
  return (
    <NavLink
      to={tab.path}
      className={({ isActive }) => navLinkClass(isActive, collapsed)}
      aria-label={tab.label}
      state={{ context: tab.context, ...extraState }}
    >
      {({ isActive }) => (
        <>
          <span className="[&_svg]:size-4">
            {isActive ? tab.activeIcon : tab.icon}
          </span>
          {!collapsed && <span className="text-sm">{tab.label}</span>}
        </>
      )}
    </NavLink>
  );
}

// Isolated so only this leaf subscribes to location changes (needed to pass the
// current location as the modal background), keeping the sidebar itself static.
function SettingsNavLink({
  tab,
  collapsed,
}: {
  tab: SidebarTab;
  collapsed: boolean;
}) {
  const location = useLocation();
  return (
    <SidebarNavLink
      tab={tab}
      collapsed={collapsed}
      extraState={{ settingsBackgroundLocation: location }}
    />
  );
}

export function DesktopSidebar({
  collapsed = false,
  onToggleCollapse,
}: DesktopSidebarProps) {
  const { t } = useLanguageContext();
  const { openCreateTaskForm } = useTaskFormContext();
  const { user, isAuthenticated, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    logout();
    setShowLogoutConfirm(false);
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const tabs = [
    {
      path: "/today",
      label: t("today"),
      icon: <HvCalendarEvent />,
      activeIcon: <HvCalendarEventFilled />,
      context: "today",
    },
    {
      path: "/upcoming",
      label: t("upcoming"),
      icon: <HvCalendarMonth />,
      activeIcon: <HvCalendarMonthFilled />,
      context: "upcoming",
    },
    {
      path: "/search",
      label: t("search") || "Search",
      icon: <HvSearch />,
      activeIcon: <HvSearchAlt />,
      context: "search",
    },
    {
      path: "/recurring",
      label: t("recurring") || "Recurring",
      icon: <HvReplayCircle />,
      activeIcon: <HvReplayCircleFilled />,
      context: "recurring",
    },
    {
      path: "/completed",
      label: t("completed") || "Completed",
      icon: <HvSquareCheck />,
      activeIcon: <HvSquareCheckFilled />,
      context: "completed",
    },
  ];

  const desktopTabs = [
    ...tabs,
    {
      path: "/settings/general",
      label: t("settings"),
      icon: <HvSettings />,
      activeIcon: <HvSettingsFilled />,
      context: "settings",
    },
  ];

  const mainTabs = desktopTabs.filter(
    (tab) => !tab.path.startsWith("/settings")
  );
  const bottomTabs = desktopTabs.filter((tab) =>
    tab.path.startsWith("/settings")
  );

  return (
    <div
      className={`${"w-full h-full"} bg-gray-50 border-gray-400 flex flex-col overflow-hidden`}
    >
      <div className="flex items-center justify-between px-3 py-3 border-b border-gray-100">
        <button
          onClick={onToggleCollapse}
          className={`p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors ${
            collapsed ? "mx-auto" : "ml-auto"
          }`}
          aria-label={collapsed ? t("expand_sidebar") : t("collapse_sidebar")}
        >
          {collapsed ? (
            <HvPanelLeft className="size-4" />
          ) : (
            <HvPanelLeftClose className="size-4" />
          )}
        </button>
      </div>

      <div className="flex-1 p-2 space-y-2">
        {/* Add Task Button */}
        <button
          onClick={() => openCreateTaskForm()}
          className={`flex text-[var(--hvsna-primary-color)] items-center w-full px-3 py-2 rounded-lg transition-colors hover:bg-gray-100 ${
            collapsed ? "justify-center" : "space-x-1"
          }`}
          aria-label={t("add_new_task") || "Add new task"}
        >
          <span className="[&_svg]:size-4">
            <HvSquareRoundedPlusFilled />
          </span>
          {!collapsed && (
            <span className="text-sm">
              {t("add_new_task") || "Add new task"}
            </span>
          )}
        </button>
        {mainTabs.map((tab) => (
          <SidebarNavLink key={tab.path} tab={tab} collapsed={collapsed} />
        ))}
        <SidebarTagsSection collapsed={collapsed} />
      </div>

      <div className="border-t border-gray-100 p-2 space-y-2">
        {bottomTabs.map((tab) => (
          <SettingsNavLink key={tab.path} tab={tab} collapsed={collapsed} />
        ))}
      </div>

      {/* Logout Confirmation Modal */}
      <Modal
        isOpen={showLogoutConfirm}
        onClose={cancelLogout}
        title={t("confirm_logout")}
      >
        <div className="p-4">
          <p className="text-sm text-gray-600 mb-6">
            {t("logout_confirmation_message")}
          </p>
          <div className="flex space-x-3 justify-end">
            <button
              onClick={cancelLogout}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              {t("cancel")}
            </button>
            <button
              onClick={confirmLogout}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
            >
              {t("sign_out")}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
