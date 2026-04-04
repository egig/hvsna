import { useState } from "react";
import { Outlet, useLocation } from "react-router";
import { Plus } from "lucide-react";
import { DesktopSidebar } from "./modules/navigation/desktop-sidebar";
import { TabBar } from "./modules/navigation/tab-bar";
import { Modal } from "./modules/navigation/modal";
import TaskForm from "./modules/task/task-form";
import TaskFormEdit from "./modules/task/task-form-edit";
import { useScreenSize } from "./modules/components/screen-size-wrapper";
import { useTaskContext } from "./modules/task/task-context";
import { useListContext } from "./modules/task/list-context";
import TaskFormDesktop from "./modules/task/task-form-desktop";
import TaskFormEditDesktop from "./modules/task/task-form-edit-desktop";
import ListFormContainer from "./modules/task/list-form-container";

export default function TabLayout() {
  const { formOpen, editingTaskId, openTaskForm, closeTaskForm } =
    useTaskContext();
  const { formOpen: listFormOpen, closeListForm } = useListContext();
  const location = useLocation();
  const { isDesktop } = useScreenSize();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleTaskSuccess = () => {
    closeTaskForm();
  };

  const handleTaskCancel = () => {
    closeTaskForm();
  };

  const handleListSuccess = () => {
    closeListForm();
  };

  const handleListCancel = () => {
    closeListForm();
  };

  // Desktop Layout with side navigation
  if (isDesktop) {
    return (
      <div className="flex h-screen">
        {/* Side Navigation */}
        <DesktopSidebar
          openTaskForm={openTaskForm}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
        />

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

          {/* List Form Modal */}
          <Modal isOpen={listFormOpen} onClose={handleListCancel}>
            <ListFormContainer />
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
      {location?.state?.context !== "browse" && (
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

      {/* List Form Modal */}
      <Modal isOpen={listFormOpen} onClose={handleListCancel}>
        <ListFormContainer />
      </Modal>
    </div>
  );
}
