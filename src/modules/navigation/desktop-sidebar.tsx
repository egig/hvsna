import { useState } from "react";
import {
  Plus,
  PanelLeftClose,
  PanelLeft,
  UserRound,
  Settings,
  MoreVertical,
  Edit,
  Trash2,
} from "lucide-react";
import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";
import { Link, useLocation } from "react-router";
import { Button } from "./button";
import { Menu } from "@base-ui/react/menu";
import { useLists } from "../task/use-lists";
import { useLanguageContext } from "../i18n/LanguageContext";
import { useListContext } from "../task/list-context";
import {
  TbSquareRoundedPlusFilled,
  TbCalendar,
  TbCalendarFilled,
  TbCalendarMonth,
  TbCalendarMonthFilled,
  TbLayoutList,
  TbLayoutListFilled,
  TbSettings,
  TbSettingsFilled,
  TbCalendarEvent,
  TbCalendarEventFilled,
} from "react-icons/tb";
import { useFeatureFlag } from "../feature-flags/useFeatureFlags";

interface DesktopSidebarProps {
  openTaskForm?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function DesktopSidebar({
  openTaskForm,
  collapsed = false,
  onToggleCollapse,
}: DesktopSidebarProps) {
  const { lists, loading, deleteList } = useLists();
  const { t } = useLanguageContext();
  const location = useLocation();
  const { openListForm } = useListContext();
  const listEnabled = useFeatureFlag("wip");
  const yearReviewEnabled = useFeatureFlag("wip");

  const handleEditList = (list: any) => {
    openListForm(list.id!);
  };

  const handleDeleteList = async (list: any) => {
    if (!confirm(`Are you sure you want to delete "${list.name}"?`)) {
      return;
    }

    const success = await deleteList(list.id!);
    if (success) {
      // List will be automatically refreshed by the hook
    }
  };

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
      path: "/year-review",
      label: "Year Review",
      icon: <TbCalendarEvent />,
      activeIcon: <TbCalendarEventFilled />,
      context: "year-review",
      hide: !yearReviewEnabled,
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
  ].filter((t) => !t.hide);

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

  return (
    <div
      className={`${
        collapsed ? "w-14" : "w-48"
      } bg-white border-r border-gray-200 flex flex-col transition-all duration-200`}
    >
      <div className="flex items-center justify-between px-3 py-3 border-b border-gray-100">
        {!collapsed && (
          <>
            <SignedIn>
              <UserButton />
            </SignedIn>
            <SignedOut>
              <Link
                to="/signin"
                className="flex items-center justify-center size-8 rounded-full bg-primary-100 hover:bg-primary-200 text-gray-400 hover:text-primary-600 transition-colors"
                title="Sign in"
              >
                <UserRound size={16} />
              </Link>
            </SignedOut>
          </>
        )}
        <button
          onClick={onToggleCollapse}
          className={`p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors ${
            collapsed ? "mx-auto" : "ml-auto"
          }`}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

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

        {!collapsed && listEnabled && (
          <div className="p-2 mt-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-gray-500 tracking-wider">
                Lists
              </h3>
              <button
                onClick={() => openListForm()}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                title="Add new list"
              >
                <Plus size={16} />
              </button>
            </div>
            <div className="space-y-1">
              {loading ? (
                <div className="text-xs text-gray-400">Loading...</div>
              ) : lists.length > 0 ? (
                lists.slice(0, 5).map((list) => {
                  const isActive = location.pathname === `/list/${list.id}`;
                  return (
                    <div key={list.id} className="group relative">
                      <Link
                        to={`/list/${list.id}`}
                        className={`flex items-center space-x-2 px-2 py-1.5 rounded-md text-sm transition-colors ${
                          isActive
                            ? "bg-gray-100"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: list.color || "#2e335a" }}
                        />
                        <span className="truncate flex-1">{list.name}</span>
                      </Link>

                      {/* Base UI Menu */}
                      <Menu.Root>
                        <Menu.Trigger className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                          <MoreVertical size={14} />
                        </Menu.Trigger>
                        <Menu.Portal>
                          <Menu.Positioner>
                            <Menu.Popup className="bg-white border border-gray-200 rounded-md shadow-lg min-w-[120px] py-1">
                              <Menu.Item
                                onClick={() => handleEditList(list)}
                                className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                              >
                                <Edit size={14} />
                                <span>Edit</span>
                              </Menu.Item>
                              <Menu.Item
                                onClick={() => handleDeleteList(list)}
                                className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                              >
                                <Trash2 size={14} />
                                <span>Delete</span>
                              </Menu.Item>
                            </Menu.Popup>
                          </Menu.Positioner>
                        </Menu.Portal>
                      </Menu.Root>
                    </div>
                  );
                })
              ) : (
                <div className="text-xs text-gray-400">No lists yet</div>
              )}
            </div>
            {lists.length > 5 && (
              <div className="mt-2">
                <Link
                  to="/list"
                  className={`text-xs transition-colors ${
                    location.pathname === "/list"
                      ? "text-blue-700 font-medium"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  View all lists →
                </Link>
              </div>
            )}
          </div>
        )}
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
    </div>
  );
}
