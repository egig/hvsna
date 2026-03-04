import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { useLog } from "../log/use-log";
import { useGoal } from "../goal/use-goal";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Task, TaskCreateInput, TaskUpdateInput } from "./types";
import { taskRepository } from "./task-repository";
import { queryKeys } from "../common/query-keys";
import { useHijriDate } from "../calendar/hijri/use-hijri-date";

interface TaskContextType {
  // Task data
  task: Task | null;

  // CRUD operations
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

  // Legacy compatibility
  refreshAllTaskLists: (today: any) => Promise<void>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{
  children: ReactNode;
  taskId?: string;
}> = ({ children, taskId }) => {
  const { createLog } = useLog();
  const queryClient = useQueryClient();
  const { getToday } = useHijriDate();
  const [task, setTask] = useState<Task | null>(null);
  const [currentTargetId, setCurrentTargetId] = useState<string | null>(null);

  // Local form state
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState<boolean>(false);

  // Use the useGoal hook when we have a goalId
  const { goal: currentGoal, getGoal } = useGoal(currentTargetId || "");

  useEffect(() => {
    if (taskId) {
      taskRepository.findById(taskId).then((fetchedTask) => {
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

  const invalidateTaskQueries = () => {
    const today = getToday();
    const todayString = today.toString();
    const tomorrowString = today.next().toString();

    queryClient.invalidateQueries({
      queryKey: queryKeys.todayTasks(todayString),
    });
    queryClient.invalidateQueries({
      queryKey: queryKeys.todayCompletedTasks(todayString),
    });
    queryClient.invalidateQueries({
      queryKey: queryKeys.upcomingTasks(tomorrowString),
    });
    queryClient.invalidateQueries({ queryKey: ["browsed-tasks"] });
  };

  // Local form functions
  const openTaskForm = (taskId?: string) => {
    setEditingTaskId(taskId || null);
    setFormOpen(true);
  };

  const closeTaskForm = () => {
    setEditingTaskId(null);
    setFormOpen(false);
  };

  const updateTaskWithLog = async (
    id: string,
    input: TaskUpdateInput,
  ): Promise<Task> => {
    // Get the current task before updating to check status change
    const currentTask = await taskRepository.findById(id);

    // Update the task
    const updatedTask = await taskRepository.update(id, input);

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

  // React Query mutation for completing tasks
  const completeTaskMutation = useMutation({
    mutationFn: (id: string) => taskRepository.completeTask(id),
    onSuccess: async (updatedTask, id) => {
      invalidateTaskQueries();

      // Handle log creation
      if (!updatedTask.targetId) {
        return;
      }

      try {
        const currentTask = await taskRepository.findById(id);
        if (currentTask?.status === 1) {
          return; // Already completed
        }

        const goal = await getGoal(updatedTask.targetId as string);
        const v = updatedTask.targetValue || 0;

        await createLog({
          trackerId: goal.trackerId,
          timestamp: Date.now(),
          value: v,
          taskId: updatedTask.id,
          attributes: updatedTask.attributes,
        });
      } catch (logError) {
        console.warn("Failed to create log for task completion:", logError);
      }
    },
    onError: (error) => {
      console.error("Failed to complete task:", error);
      throw error;
    },
  });

  // React Query mutation for reopening tasks
  const reopenTaskMutation = useMutation({
    mutationFn: (id: string) => taskRepository.reopenTask(id),
    onSuccess: async (updatedTask, id) => {
      invalidateTaskQueries();

      // Handle log creation
      if (!updatedTask.targetId) {
        return;
      }

      try {
        const currentTask = await taskRepository.findById(id);
        if (currentTask?.status === 0) {
          return; // Already pending
        }

        const goal = await getGoal(updatedTask.targetId as string);
        let v = updatedTask.targetValue || 0;
        v = -1 * v; // Negative value for reopening

        await createLog({
          trackerId: goal.trackerId,
          timestamp: Date.now(),
          value: v,
          taskId: updatedTask.id,
          attributes: updatedTask.attributes,
        });
      } catch (logError) {
        console.warn("Failed to create log for task reopening:", logError);
      }
    },
    onError: (error) => {
      console.error("Failed to reopen task:", error);
      throw error;
    },
  });

  // React Query mutation for creating tasks
  const createTaskMutation = useMutation({
    mutationFn: (input: TaskCreateInput) => taskRepository.create(input),
    onSuccess: () => {
      invalidateTaskQueries();
    },
    onError: (error) => {
      console.error("Failed to create task:", error);
      throw error;
    },
  });

  // React Query mutation for updating tasks
  const updateTaskMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: TaskUpdateInput }) =>
      updateTaskWithLog(id, input),
    onSuccess: () => {
      invalidateTaskQueries();
    },
    onError: (error) => {
      console.error("Failed to update task:", error);
      throw error;
    },
  });

  // React Query mutation for deleting tasks
  const deleteTaskMutation = useMutation({
    mutationFn: (id: string) => taskRepository.delete(id),
    onSuccess: () => {
      invalidateTaskQueries();
      setFormOpen(false);
    },
    onError: (error) => {
      console.error("Failed to delete task:", error);
      throw error;
    },
  });

  const contextValue: TaskContextType = {
    task,
    createTask: (input: TaskCreateInput) =>
      createTaskMutation.mutateAsync(input),
    updateTask: (id: string, input: TaskUpdateInput) =>
      updateTaskMutation.mutateAsync({ id, input }),
    deleteTask: (id: string) => deleteTaskMutation.mutateAsync(id),
    getTask: (id: string) => taskRepository.findById(id),
    completeTask: (id: string) => completeTaskMutation.mutateAsync(id),
    reopenTask: (id: string) => reopenTaskMutation.mutateAsync(id),
    reset: () => setTask(null),
    editingTaskId,
    formOpen,
    openTaskForm,
    closeTaskForm,
    setEditingTaskId,
    refreshAllTaskLists: () => Promise.resolve(), // Legacy compatibility
  };

  return (
    <TaskContext.Provider value={contextValue}>{children}</TaskContext.Provider>
  );
};

export const useTaskContext = (): TaskContextType => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error("useTaskContext must be used within a TaskProvider");
  }
  return context;
};
