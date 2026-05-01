import { useState } from "react";
import { Outlet, useLocation, useParams } from "react-router";
import { HvPlus } from "@/modules/icons";
import { DesktopSidebar } from "./modules/navigation/desktop-sidebar";
import { TabBar } from "./modules/navigation/tab-bar";
import { Modal } from "./modules/navigation/modal";
import TaskForm from "./modules/task/task-form";
import TaskFormEdit from "./modules/task/task-form-edit";
import { useScreenSize } from "./modules/components/screen-size-wrapper";
import { useTaskContext } from "./modules/task/task-context";
import { useProjectContext } from "./modules/task/project-context";
import ProjectFormContainer from "./modules/task/project-form-container";

export default function TabLayout() {
  const { formOpen, editingTaskId, openCreateTaskForm, closeTaskForm } =
    useTaskContext();
  const { formOpen: projectFormOpen, closeProjectForm } = useProjectContext();
  const location = useLocation();
  const params = useParams();
  const { isDesktop } = useScreenSize();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleTaskSuccess = () => {
    closeTaskForm();
  };

  const handleTaskCancel = () => {
    closeTaskForm();
  };

  const handleProjectCancel = () => {
    closeProjectForm();
  };

  // Desktop Layout with side navigation
  if (isDesktop) {
    return (
      <div className="flex h-screen">
        {/* Side Navigation */}
        <DesktopSidebar
          openCreateTaskForm={openCreateTaskForm}
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
              <TaskFormEdit
                taskId={editingTaskId}
                onSuccess={handleTaskSuccess}
              />
            )}
            {!editingTaskId && (
              <TaskForm
                onSuccess={handleTaskSuccess}
                onCancel={handleTaskCancel}
              />
            )}
          </Modal>

          {/* Project Form Modal */}
          <Modal isOpen={projectFormOpen} onClose={handleProjectCancel}>
            <ProjectFormContainer />
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
      { ["browser", "finance"].indexOf(location?.state?.context) === -1 && (
        <button
          onClick={() => {
            openCreateTaskForm({
              projectId: params.projectId,
            });
          }}
          className="absolute bottom-[calc(var(--tab-bar-height)+1rem+env(safe-area-inset-bottom))] right-[1rem] w-14 h-14 bg-[var(--hvsna-primary-color)] hover:bg-[var(--hvsna-primary-color-hover)] active:bg-[var(--hvsna-primary-color-pressed)] text-white rounded-full shadow-lg flex items-center justify-center transition-colors z-50"
          aria-label="Add new task"
          data-testid="fab-add-task"
        >
          <HvPlus size={24} />
        </button>
      )}

      <div className="flex-shrink-0">
        <TabBar />
      </div>

      {/* Task Form Modal */}
      <Modal isOpen={formOpen} onClose={handleTaskCancel}>
        {editingTaskId && (
          <TaskFormEdit taskId={editingTaskId} onSuccess={handleTaskSuccess} />
        )}
        {!editingTaskId && !isDesktop && (
          <TaskForm onSuccess={handleTaskSuccess} onCancel={handleTaskCancel} />
        )}
      </Modal>

      {/* Project Form Modal */}
      <Modal isOpen={projectFormOpen} onClose={handleProjectCancel}>
        <ProjectFormContainer />
      </Modal>
    </div>
  );
}
