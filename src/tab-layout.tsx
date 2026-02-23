import { Outlet, useLocation } from "react-router";
import { Plus } from "lucide-react";
import { TabBar } from "./modules/navigation";
import { Modal } from "./modules/navigation/modal";
import TaskForm from "./modules/task/task-form";
import TaskFormEdit from "./modules/task/task-form-edit";
import { useTask } from "./modules/task/use-task";
import { useScreenSize } from "./ui/screen-size-wrapper";

export default function TabLayout() {
  const { formOpen, editingTaskId, openTaskForm, closeTaskForm } = useTask();
  const location = useLocation();
  const { isDesktop } = useScreenSize();

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
        <div className="w-48 bg-white border-r border-gray-200 flex flex-col">
          <div className="flex-1">
            <TabBar openTaskForm={openTaskForm} />
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
              <TaskFormEdit
                taskId={editingTaskId}
                onSuccess={handleTaskSuccess}
                onCancel={handleTaskCancel}
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
      </div>
    );
  }

  // Mobile Layout with bottom tabs
  return (
    <div className="m-auto h-[100%] relative">
      <div className="h-[var(--hvsna-content-h)]">
        <Outlet />
      </div>

      {/* FAB Button for Mobile */}
      {location?.state?.context !== "settings" && (
        <button
          onClick={() => openTaskForm()}
          className="fixed bottom-[calc(var(--tab-bar-height)+1rem+env(safe-area-inset-bottom))] right-[1rem] w-14 h-14 bg-[var(--hvsna-primary-color)] hover:bg-[var(--hvsna-primary-color-hover)] active:bg-[var(--hvsna-primary-color-pressed)] text-white rounded-full shadow-lg flex items-center justify-center transition-colors z-50"
          aria-label="Add new task"
        >
          <Plus size={24} />
        </button>
      )}

      <TabBar />

      {/* Task Form Modal */}
      <Modal isOpen={formOpen} onClose={handleTaskCancel}>
        {editingTaskId && (
          <TaskFormEdit
            taskId={editingTaskId}
            onSuccess={handleTaskSuccess}
            onCancel={handleTaskCancel}
          />
        )}
        {!editingTaskId && (
          <TaskForm onSuccess={handleTaskSuccess} onCancel={handleTaskCancel} />
        )}
      </Modal>
    </div>
  );
}
