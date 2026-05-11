import {
  HvPanelLeftClose,
  HvUserRound,
  HvPanelLeft,
  HvCalendar,
  HvCalendarFilled,
  HvCalendarMonth,
  HvCalendarMonthFilled,
  HvSettings,
  HvSettingsFilled,
  HvSearch,
  HvSquareRoundedPlusFilled,
  HvSquareCheck,
  HvSquareCheckFilled,
  HvSearchAlt,
} from "@/modules/icons";
import { Link, useLocation } from "react-router";
import { SidebarTagsSection } from "../task/sidebar-tags-section";
import { Button } from "./button";
import { Menu } from "@base-ui/react/menu";
import { Modal } from "./modal";
import { useLanguageContext } from "../i18n/LanguageContext";
import { useTaskContext } from "../task/task-context";
import { useState } from "react";
import { useAuth } from "../auth/use-auth";
import { UserRound } from "lucide-react";

interface DesktopSidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function DesktopSidebar({
  collapsed = false,
  onToggleCollapse,
}: DesktopSidebarProps) {
  const { t } = useLanguageContext();
  const location = useLocation();
  const { openCreateTaskForm } = useTaskContext();
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
      icon: <HvCalendar />,
      activeIcon: <HvCalendarFilled />,
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

  const getIsActive = (tabPath: string) => {
    const isRootTab = tabPath === "/";
    const isCurrentTab = location.pathname === tabPath;
    const isChildTab = location.pathname.startsWith(`${tabPath}/`);
    return isRootTab ? isCurrentTab : isChildTab || isCurrentTab;
  };

  return (
    <div
      className={`${"w-full h-full"} bg-white border-gray-200 flex flex-col overflow-hidden`}
    >
      <div className="flex items-center justify-between px-3 py-3 border-b border-gray-100">
        {!collapsed && (
          <>
            {isAuthenticated ? (
              <div className="flex items-center space-x-2">
                <Menu.Root>
                  <Menu.Trigger className="flex items-center justify-center size-8 rounded-full bg-primary-100 text-primary-600 hover:bg-primary-200 transition-colors cursor-pointer">
                    <UserRound size={16} />
                  </Menu.Trigger>
                  <Menu.Portal>
                    <Menu.Positioner>
                      <Menu.Popup className="bg-white border border-gray-200 rounded-md shadow-lg min-w-[140px] py-1 z-50">
                        <Menu.Item
                          onClick={handleLogoutClick}
                          className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                        >
                          <HvUserRound size={16} />
                          <span>{t("sign_out")}</span>
                        </Menu.Item>
                      </Menu.Popup>
                    </Menu.Positioner>
                  </Menu.Portal>
                </Menu.Root>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900">
                    {user?.firstName || user?.email?.split("@")[0]}
                  </span>
                </div>
              </div>
            ) : (
              <Link
                to="/signin"
                className="flex items-center justify-center size-8 rounded-full bg-primary-100 hover:bg-primary-200 text-gray-400 hover:text-primary-600 transition-colors"
                title={t("sign_in")}
              >
                <UserRound size={16} />
              </Link>
            )}
          </>
        )}
        <button
          onClick={onToggleCollapse}
          className={`p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors ${
            collapsed ? "mx-auto" : "ml-auto"
          }`}
          aria-label={collapsed ? t("expand_sidebar") : t("collapse_sidebar")}
        >
          {collapsed ? (
            <HvPanelLeft size={18} />
          ) : (
            <HvPanelLeftClose size={18} />
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
          <span className="text-xl">
            <HvSquareRoundedPlusFilled />
          </span>
          {!collapsed && (
            <span className="text-sm">
              {t("add_new_task") || "Add new task"}
            </span>
          )}
        </button>
        {mainTabs.map((tab) => {
          const isActive = getIsActive(tab.path);
          return (
            <Button
              key={tab.path}
              to={tab.path}
              navType="sidebar"
              className={`flex text-[var(--hvsna-primary-color)] items-center w-full px-3 py-2 rounded-lg transition-colors ${
                collapsed ? "justify-center" : "space-x-1"
              } ${isActive ? "bg-gray-100" : "hover:bg-gray-100"}`}
              aria-label={tab.label}
              aria-current={isActive ? "page" : undefined}
              state={{ context: tab.context }}
            >
              <span className="text-xl">
                {isActive ? tab.activeIcon : tab.icon}
              </span>
              {!collapsed && <span className="text-sm">{tab.label}</span>}
            </Button>
          );
        })}
        <SidebarTagsSection collapsed={collapsed} />
      </div>
      <div className="border-t border-gray-100 p-2 space-y-2">
        {bottomTabs.map((tab) => {
          const isActive = getIsActive(tab.path);
          return (
            <Button
              key={tab.path}
              to={tab.path}
              navType="sidebar"
              className={`flex text-[var(--hvsna-primary-color)] items-center w-full px-3 py-2 rounded-lg transition-colors ${
                collapsed ? "justify-center" : "space-x-1"
              } ${isActive ? "bg-gray-100" : "hover:bg-gray-100"}`}
              aria-label={tab.label}
              aria-current={isActive ? "page" : undefined}
              state={{
                context: tab.context,
                settingsBackgroundLocation: location,
              }}
            >
              <span className="text-xl">
                {isActive ? tab.activeIcon : tab.icon}
              </span>
              {!collapsed && <span className="text-sm">{tab.label}</span>}
            </Button>
          );
        })}
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
