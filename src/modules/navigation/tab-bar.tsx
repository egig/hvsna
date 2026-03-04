import { useLocation } from "react-router";
import { Button } from "./button";
import { useLanguageContext } from "../i18n/LanguageContext";
import { useScreenSize } from "../../ui/screen-size-wrapper";
import {
  TbCalendar,
  TbCalendarFilled,
  TbCalendarMonth,
  TbCalendarMonthFilled,
  TbLayoutList,
  TbLayoutListFilled,
  TbSettings,
  TbSettingsFilled,
  TbPlus,
  TbSquarePlus,
  TbSquareRoundedPlusFilled,
} from "react-icons/tb";

export function TabBar({
  openTaskForm,
  collapsed,
}: {
  openTaskForm?: () => void;
  collapsed?: boolean;
}) {
  const { t } = useLanguageContext();
  const location = useLocation();
  const { isDesktop } = useScreenSize();

  const tabs = [
    {
      path: "/",
      label: t("today"),
      icon: <TbCalendar />,
      activeIcon: <TbCalendarFilled />,
      context: "today",
    },
    {
      path: "/upcoming",
      label: t("upcoming"),
      icon: <TbCalendarMonth />,
      activeIcon: <TbCalendarMonthFilled />,
      context: "upcoming",
    },
    {
      path: "/tasks",
      label: t("browse"),
      icon: <TbLayoutList />,
      activeIcon: <TbLayoutListFilled />,
      context: "all",
    },
  ];

  const desktopTabs = [
    ...tabs,
    {
      path: "/settings/general",
      label: t("settings"),
      icon: <TbSettings />,
      activeIcon: <TbSettingsFilled />,
      context: "settings",
    },
  ];

  const mobileTabs = [
    ...tabs,
    {
      path: "/settings",
      label: t("settings"),
      icon: <TbSettings />,
      activeIcon: <TbSettingsFilled />,
      context: "settings",
    },
  ];

  const mainTabs = desktopTabs.filter(
    (tab) => !tab.path.startsWith("/settings"),
  );
  const bottomTabs = desktopTabs.filter((tab) =>
    tab.path.startsWith("/settings"),
  );

  const getIsActive = (tabPath: string) => {
    const isRootTab = tabPath === "/";
    const isCurrentTab = location.pathname === tabPath;
    const isChildTab = location.pathname.startsWith(`${tabPath}/`);
    return isRootTab ? isCurrentTab : isChildTab || isCurrentTab;
  };

  // Desktop Layout - Vertical Sidebar
  if (isDesktop) {
    return (
      <nav className="flex flex-col h-full">
        {/* Add Task Button at top */}
        {openTaskForm && (
          <div className="pt-4 px-2 mb-2">
            <button
              onClick={() => {
                openTaskForm();
              }}
              className={`flex items-center w-full px-3 py-2 font-bold text-[var(--hvsna-primary-color)] hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors ${
                collapsed ? "justify-center" : "space-x-1"
              }`}
              aria-label="Add new task"
            >
              <TbSquareRoundedPlusFilled size={20} />
              {!collapsed && (
                <span className="font-medium text-sm">{t("add_new_task")}</span>
              )}
            </button>
          </div>
        )}

        <div className="flex-1 p-2 space-y-2">
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
        </div>

        <div className="p-2 space-y-2">
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
      </nav>
    );
  }

  // Mobile Layout - Horizontal Bottom Bar
  return (
    <nav className="p-2 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 no-select">
      <div className="flex justify-around items-center pb-[env(safe-area-inset-bottom)]">
        {mobileTabs.map((tab) => {
          const isActive = getIsActive(tab.path);
          return (
            <Button
              key={tab.path}
              to={tab.path}
              navType="tab"
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive
                  ? "text-[var(--hvsna-primary-color)] dark:text-[var(--hvsna-primary-color)]"
                  : "text-gray-600 dark:text-gray-400"
              }`}
              aria-label={tab.label}
              aria-current={isActive ? "page" : undefined}
              state={{ context: tab.context }}
            >
              <span className="text-2xl mb-1">
                {isActive ? tab.activeIcon : tab.icon}
              </span>
              <span className="text-xs font-medium">{tab.label}</span>
            </Button>
          );
        })}
      </div>
    </nav>
  );
}
