import React, {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import type { Task } from "@/domain/task";

interface TaskFormContextType {
  // Form state management
  editingTaskId: string | null;
  editingTask: Task | null;
  formOpen: boolean;
  openCreateTaskForm: () => void;
  openEditTaskForm: (taskId: string, initialTask?: Task) => void;
  closeTaskForm: () => void;
  setEditingTaskId: (taskId: string | null) => void;
  preselectedListId: string | null;
}

const TaskFormContext = createContext<TaskFormContextType | undefined>(
  undefined
);

export const TaskFormProvider: React.FC<{
  children: ReactNode;
}> = ({ children }) => {
  // Local form state
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formOpen, setFormOpen] = useState<boolean>(false);
  const [preselectedListId, setPreselectedListId] = useState<string | null>(
    null
  );

  // Local form functions
  const openCreateTaskForm = () => {
    setEditingTaskId(null);
    setFormOpen(true);
  };

  const openEditTaskForm = (taskId: string, initialTask?: Task) => {
    setEditingTaskId(taskId);
    setEditingTask(initialTask ?? null);
    setFormOpen(true);
  };

  const closeTaskForm = () => {
    setEditingTaskId(null);
    setEditingTask(null);
    setPreselectedListId(null);
    setFormOpen(false);
  };

  const contextValue: TaskFormContextType = {
    editingTaskId,
    editingTask,
    formOpen,
    openCreateTaskForm,
    openEditTaskForm,
    closeTaskForm,
    setEditingTaskId,
    preselectedListId,
  };

  return (
    <TaskFormContext.Provider value={contextValue}>
      {children}
    </TaskFormContext.Provider>
  );
};

export const useTaskFormContext = (): TaskFormContextType => {
  const context = useContext(TaskFormContext);
  if (!context) {
    throw new Error(
      "useTaskFormContext must be used within a TaskFormProvider"
    );
  }
  return context;
};
