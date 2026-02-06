import { useEffect, useState } from "react";
import type {
  Task,
  TaskCreateInput,
  TaskUpdateInput,
} from "../../lib/types/task";
import { useTaskStore } from "./task-store";
import { useLog } from "../log/use-log";
import { useGoal } from "../goal/use-goal";

export interface UseTaskReturn {
  task: Task | null;
  loading: boolean;
  error: string | null;
  createTask: (input: TaskCreateInput) => Promise<Task>;
  updateTask: (id: string, input: TaskUpdateInput) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  getTask: (id: string) => Promise<Task | null>;
  reset: () => void;
  // Form state management
  editingTaskId: string | null;
  formOpen: boolean;
  openTaskForm: (taskId?: string) => void;
  closeTaskForm: () => void;
  setEditingTaskId: (taskId: string | null) => void;
}

export const useTask = (taskId?: string): UseTaskReturn => {
  const store = useTaskStore();
  const getTask = useTaskStore(s => s.getTask);
  const createTask = useTaskStore(s => s.getTask);
  const updateTask = useTaskStore(s => s.updateTask);

  const { createLog } = useLog();
  const [task, setTask] = useState<Task | null>(null);
  const [currentTargetId, setCurrentTargetId] = useState<string | null>(null);

  // Use the useGoal hook when we have a goalId
  const { goal: currentGoal, getGoal } = useGoal(currentTargetId || "");

  useEffect(() => {
    if (taskId) {
      getTask(taskId).then((fetchedTask) => {
        if (fetchedTask) {
          setTask(fetchedTask);
          // Update targetId if task has one
          if (fetchedTask.targetId !== currentTargetId) {
            setCurrentTargetId(fetchedTask.targetId || null);
          }
        }
      });
    }
  }, [taskId, currentTargetId]);

  const updateTaskWithLog = async (
    id: string,
    input: TaskUpdateInput,
  ): Promise<Task> => {
    // Get the current task before updating to check status change
    const currentTask = await getTask(id);

    // Update the task
    const updatedTask = await updateTask(id, input);

    if (!input.targetId) {
      return updatedTask;
    }

    // Create log if status changed
    if (
      input.status !== undefined &&
      currentTask &&
      input.status !== currentTask.status
    ) {
      try {
        const goal = await getGoal(updatedTask.targetId as string);
        await createLog({
          trackerId: goal.trackerId,
          timestamp: Date.now(),
          value: updatedTask.targetValue as number, // 1 for completed, 0 for re-opened
          taskId: updatedTask.id,
          attributes: {
            newStatus: input.status,
            targetValue: updatedTask.targetValue,
          },
        });
      } catch (logError) {
        // Log creation failure shouldn't break task update
        console.warn("Failed to create log for task status change:", logError);
      }
    }

    return updatedTask;
  };

  return {
    task,
    loading: store.loading,
    error: store.error,
    createTask: (input: TaskCreateInput) => store.createTask(input),
    updateTask: updateTaskWithLog,
    deleteTask: (id: string) => store.deleteTask(id),
    getTask: (id: string) => store.getTask(id),
    reset: () => setTask(null),
    // Form state management
    editingTaskId: store.editingTaskId,
    formOpen: store.formOpen,
    openTaskForm: store.openTaskForm,
    closeTaskForm: store.closeTaskForm,
    setEditingTaskId: store.setEditingTaskId,
  };
};
