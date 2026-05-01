import {
  HvPlus,
  HvPanelLeftClose,
  HvUserRound,
  HvMoreVertical,
  HvEdit,
  HvTrash2,
  HvPanelLeft,
} from "@/modules/icons";
import { Link, useLocation } from "react-router";
import { Button } from "./button";
import { Menu } from "@base-ui/react/menu";
import { Modal } from "./modal";
import { useProjects } from "../task/use-projects";
import { useLanguageContext } from "../i18n/LanguageContext";
import { useProjectContext } from "../task/project-context";
import { DeleteProjectModal } from "../task/delete-project-modal";
import { useTasks } from "../task/use-tasks";
import { useState } from "react";
import { useAuth } from "../auth/use-auth";
import {
  HvSquareRoundedPlusFilled,
  HvCalendar,
  HvCalendarFilled,
  HvCalendarMonth,
  HvCalendarMonthFilled,
  HvLayoutList,
  HvLayoutListFilled,
  HvSearch,
  HvSettings,
  HvSettingsFilled,
  HvOutlineInbox,
  HvHiInbox,
  HvTag,
  HvWallet,
} from "@/modules/icons";
import { UserRound } from "lucide-react";

interface DesktopSidebarProps {
  openCreateTaskForm?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function DesktopSidebar({
  openCreateTaskForm,
  collapsed = false,
  onToggleCollapse,
}: DesktopSidebarProps) {
  const { projects, loading, deleteProject } = useProjects();
  const { tasks } = useTasks();
  const { t } = useLanguageContext();
  const location = useLocation();
  const { openProjectForm } = useProjectContext();
  const { user, isAuthenticated, logout } = useAuth();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleEditProject = (project: any) => {
    openProjectForm(project.id!);
  };

  const handleDeleteProject = (project: any) => {
    setSelectedProject(project);
    setShowDeleteModal(true);
  };

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

  const confirmDeleteProject = async (deleteTasks: boolean) => {
    if (!selectedProject) {
      return;
    }

    const success = await deleteProject(selectedProject.id!, deleteTasks);
    if (success) {
      setShowDeleteModal(false);
      setSelectedProject(null);
      // List will be automatically refreshed by the hook
    }
  };

  // Helper to get tasks for a list (filters open tasks and groups by list ID)
  const getProjectTasks = (projectId: string) => {
    return tasks.filter(
      (task) =>
        task.status === 0 &&
        task.projectId === projectId
    );
  };

  const tabs = [
    {
      path: "/",
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
      path: "/inbox",
      label: t("inbox") || "Inbox",
      icon: <HvOutlineInbox />,
      activeIcon: <HvHiInbox />,
      context: "inbox",
    },
    {
      path: "/tasks",
      label: t("search"),
      icon: <HvSearch />,
      activeIcon: <HvSearch />,
      context: "all",
    },
    {
      path: "/tags",
      label: t("tags") || "Tags",
      icon: <HvTag />,
      activeIcon: <HvTag />,
      context: "tags",
    },
    {
      path: "/finance",
      label: t("finance"),
      icon: <HvWallet />,
      activeIcon: <HvWallet />,
      context: "finance",
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
      className={`${
        collapsed ? "w-14" : "w-48"
      } bg-white border-r border-gray-200 flex flex-col transition-all duration-200`}
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

      {openCreateTaskForm && (
        <div className="pt-4 px-2 mb-2">
          <button
            onClick={() => {
              openCreateTaskForm();
            }}
            className={`flex items-center w-full px-3 py-2 font-bold text-[var(--hvsna-primary-color)] hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors ${
              collapsed ? "justify-center" : "space-x-1"
            }`}
            aria-label="Add new task"
          >
            <HvSquareRoundedPlusFilled size={20} />
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

        {!collapsed && (
          <div className="p-2 mt-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-gray-500 tracking-wider">
                {t("projects") || "Projects"}
              </h3>
              <button
                onClick={() => openProjectForm()}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                title={t("add_new_project")}
              >
                <HvPlus size={16} />
              </button>
            </div>
            <div className="space-y-1">
              {loading ? (
                <div className="text-xs text-gray-400">
                  {t("loading") || "Loading..."}
                </div>
              ) : projects.length > 0 ? (
                projects.slice(0, 5).map((project) => {
                  const isActive = location.pathname === `/project/${project.id}`;
                  return (
                    <div key={project.id} className="group relative">
                      <Link
                        to={`/project/${project.id}`}
                        className={`flex items-center space-x-2 px-2 py-1.5 rounded-md text-sm transition-colors ${
                          isActive
                            ? "bg-gray-100"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        <span className="truncate flex-1">{project.name}</span>
                      </Link>

                      <Menu.Root>
                        <Menu.Trigger className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                          <HvMoreVertical size={14} />
                        </Menu.Trigger>
                        <Menu.Portal>
                          <Menu.Positioner>
                            <Menu.Popup className="bg-white border border-gray-200 rounded-md shadow-lg min-w-[120px] py-1">
                              <Menu.Item
                                onClick={() => handleEditProject(project)}
                                className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                              >
                                <HvEdit size={14} />
                                <span>{t("edit")}</span>
                              </Menu.Item>
                              <Menu.Item
                                onClick={() => handleDeleteProject(project)}
                                className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                              >
                                <HvTrash2 size={14} />
                                <span>{t("delete")}</span>
                              </Menu.Item>
                            </Menu.Popup>
                          </Menu.Positioner>
                        </Menu.Portal>
                      </Menu.Root>
                    </div>
                  );
                })
              ) : (
                <div className="text-xs text-gray-400">
                  {t("no_projects_yet") || "No projects yet"}
                </div>
              )}
            </div>
            {projects.length > 5 && (
              <div className="mt-2">
                <Link
                  to="/browse"
                  className={`text-xs transition-colors ${
                    location.pathname === "/browse"
                      ? "text-blue-700 font-medium"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {t("view_all_projects") || "View all projects"} →
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

      {/* Delete Confirmation Modal */}
      {selectedProject && (
        <DeleteProjectModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedProject(null);
          }}
          onConfirm={confirmDeleteProject}
          projectName={selectedProject.name || ""}
          tasks={getProjectTasks(selectedProject.id)}
        />
      )}

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
