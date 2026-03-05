import { useState } from "react";
import { Outlet, useLocation } from "react-router";
import { Plus, PanelLeftClose, PanelLeft, UserRound } from "lucide-react";
import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";
import { Link } from "react-router";
import { TabBar } from "./modules/navigation";
import { Modal } from "./modules/navigation/modal";
import TaskForm from "./modules/task/task-form";
import TaskFormEdit from "./modules/task/task-form-edit";
import { useScreenSize } from "./ui/screen-size-wrapper";
import { useTaskContext } from "./modules/task/task-context";
import TaskFormDesktop from "./modules/task/task-form-desktop";
import TaskFormEditDesktop from "./modules/task/task-form-edit-desktop";

export default function TabLayout() {
  const { formOpen, editingTaskId, openTaskForm, closeTaskForm } =
    useTaskContext();
  const location = useLocation();
  const { isDesktop } = useScreenSize();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleTaskSuccess = () => {
    closeTaskForm();
  };

  const handleTaskCancel = () => {
    closeTaskForm();
  };

  // Desktop Layout with side navigation
  if (isDesktop) {
    return (
      <div className="flex h-screen">
        {/* Side Navigation */}
        <div
          className={`${
            sidebarCollapsed ? "w-14" : "w-48"
          } bg-white border-r border-gray-200 flex flex-col transition-all duration-200`}
        >
          {/* Sidebar Header */}
          <div className="flex items-center justify-between px-3 py-3 border-b border-gray-100">
            {!sidebarCollapsed && (
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
              onClick={() => setSidebarCollapsed((prev) => !prev)}
              className={`p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors ${
                sidebarCollapsed ? "mx-auto" : "ml-auto"
              }`}
              aria-label={
                sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
              }
            >
              {sidebarCollapsed ? (
                <PanelLeft size={18} />
              ) : (
                <PanelLeftClose size={18} />
              )}
            </button>
          </div>
          <div className="flex-1">
            <TabBar openTaskForm={openTaskForm} collapsed={sidebarCollapsed} />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col relative border-r border-gray-200">
          <div className="flex-1 overflow-auto">
            <Outlet />
          </div>

          {/* Task Form Modal */}
          <Modal isOpen={formOpen} onClose={handleTaskCancel}>
            {editingTaskId && (
              <TaskFormEditDesktop
                taskId={editingTaskId}
                onSuccess={handleTaskSuccess}
                onCancel={handleTaskCancel}
              />
            )}
            {!editingTaskId && (
              <TaskFormDesktop
                onSuccess={handleTaskSuccess}
                onCancel={handleTaskCancel}
              />
            )}
          </Modal>
        </div>
      </div>
    );
  }

  // Mobile Layout with bottom tabs
  return (
    <div className="h-[100dvh] flex flex-col">
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>

      {/* FAB Button for Mobile */}
      {location?.state?.context !== "settings" && (
        <button
          onClick={() => openTaskForm()}
          className="absolute bottom-[calc(var(--tab-bar-height)+1rem+env(safe-area-inset-bottom))] right-[1rem] w-14 h-14 bg-[var(--hvsna-primary-color)] hover:bg-[var(--hvsna-primary-color-hover)] active:bg-[var(--hvsna-primary-color-pressed)] text-white rounded-full shadow-lg flex items-center justify-center transition-colors z-50"
          aria-label="Add new task"
        >
          <Plus size={24} />
        </button>
      )}

      <div className="flex-shrink-0">
        <TabBar />
      </div>

      {/* Task Form Modal */}
      <Modal isOpen={formOpen} onClose={handleTaskCancel}>
        {editingTaskId && (
          <TaskFormEdit
            taskId={editingTaskId}
            onSuccess={handleTaskSuccess}
            onCancel={handleTaskCancel}
          />
        )}
        {!editingTaskId && !isDesktop && (
          <TaskForm onSuccess={handleTaskSuccess} onCancel={handleTaskCancel} />
        )}
      </Modal>
    </div>
  );
}
