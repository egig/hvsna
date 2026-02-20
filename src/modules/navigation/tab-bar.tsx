import { useLocation } from "react-router";
import { Button } from "./button";
import {
  CheckSquare,
  Settings,
  Target,
  Calendar,
  ListFilter,
  List,
  SquareLibrary,
  CalendarClock,
  Info,
  Plus,
} from "lucide-react";
import { useLanguageContext } from "../i18n/LanguageContext";
import { useScreenSize } from "../../ui/screen-size-wrapper";

export function TabBar({ openTaskForm }: { openTaskForm?: () => void }) {
  const { t } = useLanguageContext();
  const location = useLocation();
  const { isDesktop } = useScreenSize();

  const tabs = [
    { path: "/", label: t("today"), icon: <Calendar />, context: "today" },
    {
      path: "/upcoming",
      label: t("upcoming"),
      icon: <CalendarClock />,
      context: "upcoming",
    },
    {
      path: "/tasks",
      label: t("browse"),
      icon: <SquareLibrary />,
      context: "all",
    },
    {
      path: "/settings",
      label: t("settings"),
      icon: <Settings />,
      context: "settings",
    },
  ];

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
          <div className="p-4 border-b border-gray-200">
            <button
              onClick={() => {
                openTaskForm();
              }}
              className="flex items-center space-x-3 w-full px-3 py-2 bg-[var(--hvsna-primary-color)] hover:bg-[var(--hvsna-primary-color-hover)] text-white rounded-lg transition-colors"
              aria-label="Add new task"
            >
              <Plus size={20} />
              <span className="font-medium">{t("add_new_task")}</span>
            </button>
          </div>
        )}

        <div className="flex-1 p-4 space-y-2">
          {tabs.map((tab) => {
            const isActive = getIsActive(tab.path);
            return (
              <Button
                key={tab.path}
                to={tab.path}
                navType="sidebar"
                className={`flex items-center space-x-3 w-full px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? "bg-[var(--hvsna-primary-color-active-tab)] text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
                aria-label={tab.label}
                aria-current={isActive ? "page" : undefined}
                state={{ context: tab.context }}
              >
                <span className="text-xl">{tab.icon}</span>
                <span className="font-medium">{tab.label}</span>
              </Button>
            );
          })}
        </div>
      </nav>
    );
  }

  // Mobile Layout - Horizontal Bottom Bar
  return (
    <nav className="fixed h-[calc(var(--tab-bar-height)+env(safe-area-inset-bottom))] p-2 bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 no-select">
      <div className="flex justify-around items-center pb-[env(safe-area-inset-bottom)]">
        {tabs.map((tab) => {
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
              <span className="text-2xl mb-1">{tab.icon}</span>
              <span className="text-xs font-medium">{tab.label}</span>
            </Button>
          );
        })}
      </div>
    </nav>
  );
}
