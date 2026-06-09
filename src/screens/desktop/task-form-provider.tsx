import { type ReactNode } from "react";
import {
  TaskFormProvider,
  useTaskFormContext,
} from "@/modules/task/task-form-context";
import TaskFormDesktop from "./task-form";
import TaskFormEditDesktop from "./task-form-edit";
import { Modal } from "./modal";

function DesktopTaskFormModal() {
  const { formOpen, closeTaskForm, editingTaskId, editingTask } =
    useTaskFormContext();

  return (
    <Modal isOpen={formOpen} onClose={closeTaskForm}>
      {editingTaskId && (
        <TaskFormEditDesktop
          taskId={editingTaskId}
          initialTask={editingTask ?? undefined}
          onSuccess={closeTaskForm}
          onDelete={closeTaskForm}
        />
      )}
      {!editingTaskId && (
        <TaskFormDesktop onSuccess={closeTaskForm} onCancel={closeTaskForm} />
      )}
    </Modal>
  );
}

export default function DesktopTaskFormProvider({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <TaskFormProvider>
      {children}
      <DesktopTaskFormModal />
    </TaskFormProvider>
  );
}
