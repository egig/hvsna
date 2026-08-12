import { type ReactNode } from "react";
import {
  TaskFormProvider,
  useTaskFormContext,
} from "@/modules/task/task-form-context";
import TaskFormMobile from "./task-form";
import TaskFormEditMobile from "./task-form-edit";
import { Modal } from "./modal";

function MobileTaskFormModal() {
  const { formOpen, closeTaskForm, editingTaskId, editingTask } =
    useTaskFormContext();

  return (
    <Modal isOpen={formOpen} onClose={closeTaskForm}>
      {editingTaskId && (
        <TaskFormEditMobile
          taskId={editingTaskId}
          initialTask={editingTask ?? undefined}
          onSuccess={closeTaskForm}
          onDelete={closeTaskForm}
        />
      )}
      {!editingTaskId && (
        <TaskFormMobile onSuccess={closeTaskForm} onCancel={closeTaskForm} />
      )}
    </Modal>
  );
}

export default function MobileTaskFormProvider({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <TaskFormProvider>
      {children}
      <MobileTaskFormModal />
    </TaskFormProvider>
  );
}
