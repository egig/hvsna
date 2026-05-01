import { useState } from "react";
import { Outlet, useLocation, useParams } from "react-router";
import { HvPlus, HvWallet } from "@/modules/icons";
import { DesktopSidebar } from "./modules/navigation/desktop-sidebar";
import { TabBar } from "./modules/navigation/tab-bar";
import { Modal } from "./modules/navigation/modal";
import TaskForm from "./modules/task/task-form";
import TaskFormEdit from "./modules/task/task-form-edit";
import { useScreenSize } from "./modules/components/screen-size-wrapper";
import { useTaskContext } from "./modules/task/task-context";
import { useProjectContext } from "./modules/task/project-context";
import ProjectFormContainer from "./modules/task/project-form-container";
import { useFinanceContext } from "./modules/finance/finance-context";
import { FinanceForm } from "./modules/finance/finance-form";

interface MobileLayoutProps {
  formOpen: boolean;
  editingTaskId: string | null;
  projectFormOpen: boolean;
  handleTaskSuccess: () => void;
  handleTaskCancel: () => void;
  handleProjectCancel: () => void;
  openCreateTaskForm: (opts?: { projectId?: string }) => void;
  location: ReturnType<typeof useLocation>;
  params: ReturnType<typeof useParams>;
}

function MobileLayout({
  formOpen,
  editingTaskId,
  projectFormOpen,
  handleTaskSuccess,
  handleTaskCancel,
  handleProjectCancel,
  openCreateTaskForm,
  location,
  params,
}: MobileLayoutProps) {
  const { openCreateForm, formOpen: financeFormOpen, closeForm } = useFinanceContext();
  const isToday = location?.state?.context === "today";

  return (
    <div className="h-[100dvh] flex flex-col">
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>

      {/* Task FAB */}
      {["browser", "finance", "today"].indexOf(location?.state?.context) === -1 && (
        <button
          onClick={() => openCreateTaskForm({ projectId: (params as Record<string, string>).projectId })}
          className="absolute bottom-[calc(var(--tab-bar-height)+1rem+env(safe-area-inset-bottom))] right-[1rem] w-14 h-14 bg-[var(--hvsna-primary-color)] hover:bg-[var(--hvsna-primary-color-hover)] active:bg-[var(--hvsna-primary-color-pressed)] text-white rounded-full shadow-lg flex items-center justify-center transition-colors z-50"
          aria-label="Add new task"
          data-testid="fab-add-task"
        >
          <HvPlus size={24} />
        </button>
      )}

      {/* Finance FAB — today page only */}
      {["finance", "today"].indexOf(location?.state?.context) !== -1  && (
        <button
          onClick={openCreateForm}
          className="absolute bottom-[calc(var(--tab-bar-height)+1rem+env(safe-area-inset-bottom))] right-[1rem] w-14 h-14 text-white rounded-full shadow-lg flex items-center justify-center transition-colors z-50"
          style={{ backgroundColor: "var(--hvsna-success-color)" }}
          aria-label="Log finance entry"
        >
          <HvWallet size={22} />
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
        {!editingTaskId && (
          <TaskForm onSuccess={handleTaskSuccess} onCancel={handleTaskCancel} />
        )}
      </Modal>

      {/* Project Form Modal */}
      <Modal isOpen={projectFormOpen} onClose={handleProjectCancel}>
        <ProjectFormContainer />
      </Modal>

      {/* Finance Form Modal */}
      <Modal isOpen={financeFormOpen} onClose={closeForm} noPadding>
        <FinanceForm />
      </Modal>
    </div>
  );
}

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
      <MobileLayout
        formOpen={formOpen}
        editingTaskId={editingTaskId}
        projectFormOpen={projectFormOpen}
        handleTaskSuccess={handleTaskSuccess}
        handleTaskCancel={handleTaskCancel}
        handleProjectCancel={handleProjectCancel}
        openCreateTaskForm={openCreateTaskForm}
        location={location}
        params={params}
      />
  );
}
