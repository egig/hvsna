import { useLocation } from "react-router";
import { Button } from "./button";
import { useLanguageContext } from "../i18n/LanguageContext";
import { useScreenSize } from "../components/screen-size-wrapper";
import {
  TbCalendar,
  TbCalendarFilled,
  TbCalendarMonth,
  TbCalendarMonthFilled,
  TbFileFilled,
  TbList,
} from "react-icons/tb";
import {
  HiOutlineEllipsisHorizontalCircle,
  HiEllipsisHorizontalCircle,
} from "react-icons/hi2";
import { HiOutlineInbox, HiInbox } from "react-icons/hi2";

export function TabBar() {
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
      path: "/inbox",
      label: "Inbox",
      icon: <HiOutlineInbox />,
      activeIcon: <HiInbox />,
      context: "inbox",
    },
    {
      path: "/browse",
      label: t("Browse"),
      icon: <HiOutlineEllipsisHorizontalCircle />,
      activeIcon: <HiEllipsisHorizontalCircle />,
      context: "browse",
    },
  ];

  const getIsActive = (tabPath: string) => {
    const isRootTab = tabPath === "/";
    const isCurrentTab = location.pathname === tabPath;
    const isChildTab = location.pathname.startsWith(`${tabPath}/`);
    return isRootTab ? isCurrentTab : isChildTab || isCurrentTab;
  };

  // Only render mobile layout - desktop is handled by DesktopSidebar
  if (isDesktop) {
    return null;
  }

  // Mobile Layout - Horizontal Bottom Bar
  return (
    <nav className="p-2 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 no-select">
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
