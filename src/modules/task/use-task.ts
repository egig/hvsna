import { useTaskContext } from "./task-context";
import type { Task, TaskCreateInput, TaskUpdateInput } from "./types";

export interface UseTaskReturn {
  task: Task | null;
  createTask: (input: TaskCreateInput) => Promise<Task>;
  updateTask: (id: string, input: TaskUpdateInput) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  getTask: (id: string) => Promise<Task | null>;
  completeTask: (id: string) => Promise<Task>;
  reopenTask: (id: string) => Promise<Task>;
  reset: () => void;
  // Form state management
  editingTaskId: string | null;
  formOpen: boolean;
  openTaskForm: (taskId?: string) => void;
  closeTaskForm: () => void;
  setEditingTaskId: (taskId: string | null) => void;
}

export const useTask = (): UseTaskReturn => {
  return useTaskContext();
};
