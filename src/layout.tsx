import { useState, useRef, useCallback } from "react";
import { Outlet, useLocation, useParams } from "react-router";
import { Allotment, type AllotmentHandle } from "allotment";
import { HvPlus} from "@/modules/icons";
import { DesktopSidebar } from "./modules/navigation/desktop-sidebar";
import { TabBar } from "./modules/navigation/tab-bar";
import { Modal } from "./modules/navigation/modal";
import TaskForm from "./modules/task/task-form";
import TaskFormEdit from "./modules/task/task-form-edit";
import { useScreenSize } from "./modules/components/screen-size-wrapper";
import { useTaskContext } from "./modules/task/task-context";
import { Task } from "./domain/task";


import "allotment/dist/style.css";

interface MobileLayoutProps {
  formOpen: boolean;
  editingTaskId: string | null;
  editingTask: Task | null;
  handleTaskSuccess: () => void;
  handleTaskCancel: () => void;
  openCreateTaskForm: () => void;
  location: ReturnType<typeof useLocation>;
  params: ReturnType<typeof useParams>;
}

function MobileLayout({
  formOpen,
  editingTaskId,
  editingTask,
  handleTaskSuccess,
  handleTaskCancel,
  openCreateTaskForm,
  location,
  params,
}: MobileLayoutProps) {
  return (
    <div className="h-[100dvh] flex flex-col">
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>

      {/* Task FAB */}
      {["today", "upcoming"].indexOf(location?.state?.context) != -1 && (
        <button
          onClick={() => openCreateTaskForm()}
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
          <TaskFormEdit
            taskId={editingTaskId}
            initialTask={editingTask ?? undefined}
            onSuccess={handleTaskSuccess}
            onDelete={handleTaskCancel}
          />
        )}
        {!editingTaskId && (
          <TaskForm onSuccess={handleTaskSuccess} onCancel={handleTaskCancel} />
        )}
      </Modal>
    </div>
  );
}

export default function TabLayout() {
  const {
    formOpen,
    editingTaskId,
    editingTask,
    openCreateTaskForm,
    closeTaskForm,
  } = useTaskContext();
  const location = useLocation();
  const params = useParams();
  const { isDesktop } = useScreenSize();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const allotmentRef = useRef<AllotmentHandle>(null);

  const handleTaskSuccess = () => closeTaskForm();
  const handleTaskCancel = () => closeTaskForm();

  const handleToggleSidebar = useCallback(() => {
    const newCollapsed = !sidebarCollapsed;
    setSidebarCollapsed(newCollapsed);
    const newSize = newCollapsed ? 56 : 192;
    allotmentRef.current?.resize([newSize, window.innerWidth - newSize]);
  }, [sidebarCollapsed]);

  const handleSidebarChange = useCallback((sizes: number[]) => {
    setSidebarCollapsed(sizes[0] < 120);
  }, []);

  // Desktop Layout with side navigation
  if (isDesktop) {
    return (
      <Allotment
        ref={allotmentRef}
        className="h-screen"
        proportionalLayout={false}
        onChange={handleSidebarChange}
      >
        {/* Sidebar pane */}
        <Allotment.Pane preferredSize={192} minSize={56} maxSize={400} snap>
          <DesktopSidebar
            collapsed={sidebarCollapsed}
            onToggleCollapse={handleToggleSidebar}
          />
        </Allotment.Pane>

        {/* Main content pane */}
        <Allotment.Pane minSize={400}>
          <div className="flex flex-col h-full relative">
            <div className="flex-1 overflow-auto">
              <Outlet />
            </div>

            {/* Task Form Modal */}
            <Modal isOpen={formOpen} onClose={handleTaskCancel}>
              {editingTaskId && (
                <TaskFormEdit
                  taskId={editingTaskId}
                  initialTask={editingTask ?? undefined}
                  onSuccess={handleTaskSuccess}
                  onDelete={handleTaskCancel}
                />
              )}
              {!editingTaskId && (
                <TaskForm
                  onSuccess={handleTaskSuccess}
                  onCancel={handleTaskCancel}
                />
              )}
            </Modal>
          </div>
        </Allotment.Pane>
      </Allotment>
    );
  }

  // Mobile Layout with bottom tabs
  return (
    <MobileLayout
      formOpen={formOpen}
      editingTaskId={editingTaskId}
      editingTask={editingTask}
      handleTaskSuccess={handleTaskSuccess}
      handleTaskCancel={handleTaskCancel}
      openCreateTaskForm={openCreateTaskForm}
      location={location}
      params={params}
    />
  );
}
