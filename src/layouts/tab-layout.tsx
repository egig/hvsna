import { useState } from "react";
import { Outlet } from "react-router";
import { Plus } from "lucide-react";
import { TabBar } from "../modules/navigation";
import { Modal } from "../modules/navigation/modal";
import TaskForm from "../modules/task/task-form";
import { useTask } from "../modules/task/use-task";

export default function TabLayout() {
  const { formOpen, editingTaskId, openTaskForm, closeTaskForm } =
    useTask();

  const handleTaskSuccess = () => {
    closeTaskForm();
  };

  const handleTaskCancel = () => {
    closeTaskForm();
  };

  return (
    <div className="m-auto h-[100%] relative">
      <div className="h-[calc(100%-70px)]">
        <Outlet />
      </div>
      <TabBar />

      {/* FAB Button */}
      <button
        onClick={() => openTaskForm()}
        className="fixed bottom-24 right-4 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-colors z-50"
        aria-label="Add new task"
      >
        <Plus size={24} />
      </button>

      {/* Task Form Modal */}
      <Modal isOpen={formOpen} onClose={handleTaskCancel}>
        <TaskForm
          taskId={editingTaskId}
          onSuccess={handleTaskSuccess}
          onCancel={handleTaskCancel}
        />
      </Modal>
    </div>
  );
}
