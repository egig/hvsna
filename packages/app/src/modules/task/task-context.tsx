import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { useMutation } from "@tanstack/react-query";
import type { Task, TaskCreateInput, TaskUpdateInput } from "@/domain/task";
import { useTaskRepository } from "./use-task-repository";
import { useRecurringTaskRepository } from "./use-recurring-task-repository";
import { useReminderRegistryRepository } from "./use-reminder-registry-repository";
import { materializeVirtualTask as materializeVirtualTaskFn } from "./recurring-task-utils";
import { ReminderService } from "./reminder-service";
import { useSettings } from "../settings";
import {
  useTaskReminder,
  cancelVirtualReminder,
} from "./recurring-reminder-scheduler";
import { useInvalidateTaskQueries } from "./use-invalidate-task-queries";
import logger from "../logger";

interface TaskContextType {
  // Task data
  task: Task | null;

  createTask: (input: TaskCreateInput) => Promise<Task>;
  updateTask: (id: string | number, input: TaskUpdateInput) => Promise<Task>;
  deleteTask: (id: string | number) => Promise<void>;
  deleteRecurringTaskSeries: (
    recurringTaskId: string | number
  ) => Promise<void>;
  getTask: (id: string | number) => Promise<Task | null>;
  completeTask: (id: string | number) => Promise<Task>;
  reopenTask: (id: string | number) => Promise<Task>;
  materializeVirtualTask: (task: Task) => Promise<Task>;
  reset: () => void;

  // Legacy compatibility
  refreshAllTaskLists: (today: any) => Promise<void>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{
  children: ReactNode;
  taskId?: string;
}> = ({ children, taskId }) => {
  const invalidateTaskQueries = useInvalidateTaskQueries();
  const { settings } = useSettings();
  const taskRepo = useTaskRepository();
  const recurringRepo = useRecurringTaskRepository();
  const reminderRegistry = useReminderRegistryRepository();
  const [task, setTask] = useState<Task | null>(null);
  const scheduleRecurringTaskReminders = useTaskReminder();

  useEffect(() => {
    if (taskId) {
      taskRepo.findById(taskId).then((fetchedTask: Task | null) => {
        if (fetchedTask) {
          setTask(fetchedTask);
        }
      });
    }
  }, [taskId, taskRepo]);

  // Schedule reminders for virtual recurring task occurrences on startup
  useEffect(() => {
    recurringRepo
      .find()
      .then((templates) =>
        scheduleRecurringTaskReminders(reminderRegistry, templates)
      )
      .catch((err) =>
        logger.error("Failed to schedule recurring task reminders:", err)
      );
  }, [recurringRepo, reminderRegistry, scheduleRecurringTaskReminders]);

  const updateTaskWithLog = async (
    id: string | number,
    input: TaskUpdateInput
  ): Promise<Task> => {
    // Update the task
    const updatedTask = await taskRepo.update(id, input);
    return updatedTask;
  };

  // React Query mutation for completing tasks
  const completeTaskMutation = useMutation({
    mutationFn: async (id: string | number) => {
      return taskRepo.completeTask(id);
    },
    onSuccess: async (updatedTask: Task, id) => {
      // Cancel reminders when task is completed
      if (settings.notifications) {
        try {
          await ReminderService.cancelTaskReminders(id);
          // The reminder may have been scheduled under the virtual task ID before
          // materialization — cancel that too so it doesn't still fire.
          if (updatedTask.recurringTaskId && updatedTask.atEpochMillis) {
            const virtualId = `vtask_${updatedTask.recurringTaskId}_${updatedTask.atEpochMillis}`;
            await ReminderService.cancelTaskReminders(virtualId);
          }
        } catch (error) {
          logger.error("Failed to cancel task reminders:", error);
        }
      }

      invalidateTaskQueries();
    },
    onError: (error) => {
      logger.error("Failed to complete task:", error);
      throw error;
    },
  });

  // React Query mutation for reopening tasks
  const reopenTaskMutation = useMutation({
    mutationFn: (id: string | number) => taskRepo.reopenTask(id),
    onSuccess: async (updatedTask: Task, id) => {
      if (settings.notifications && updatedTask.atTime?.includes(":")) {
        try {
          await ReminderService.updateTaskReminders(
            updatedTask,
            settings.reminderMinutesBefore ?? 15
          );
        } catch (error) {
          logger.error("Failed to reschedule task reminders:", error);
        }
      }

      invalidateTaskQueries();
    },
    onError: (error) => {
      console.error("Failed to reopen task:", error);
      throw error;
    },
  });

  // React Query mutation for creating tasks
  const createTaskMutation = useMutation({
    mutationFn: (input: TaskCreateInput) => taskRepo.create(input),
    onSuccess: async (createdTask: Task) => {
      // Schedule reminders if notifications are enabled and task has scheduled time
      if (settings.notifications && createdTask.atTime?.includes(":")) {
        try {
          await ReminderService.scheduleTaskReminders(
            createdTask,
            settings.reminderMinutesBefore ?? 15
          );
        } catch (error) {
          console.error("Failed to schedule task reminders:", error);
        }
      }
      invalidateTaskQueries();
    },
    onError: (error) => {
      console.error("Failed to create task:", error);
      throw error;
    },
  });

  // React Query mutation for updating tasks
  const updateTaskMutation = useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string | number;
      input: TaskUpdateInput;
    }) => updateTaskWithLog(id, input),
    onSuccess: async (_, variables) => {
      // Update reminders if notifications are enabled
      if (settings.notifications) {
        try {
          const updatedTask = await taskRepo.findById(variables.id);
          if (updatedTask) {
            if (updatedTask.status === 1 || !updatedTask.atEpochMillis) {
              // Task completed or no scheduled time - cancel reminders
              await ReminderService.cancelTaskReminders(variables.id);
            } else {
              // Task updated - reschedule reminders
              await ReminderService.updateTaskReminders(
                updatedTask,
                settings.reminderMinutesBefore ?? 15
              );
            }
          }
        } catch (error) {
          console.error("Failed to update task reminders:", error);
        }
      }
      invalidateTaskQueries();
    },
    onError: (error) => {
      console.error("Failed to update task:", error);
      throw error;
    },
  });

  // React Query mutation for deleting tasks
  const deleteTaskMutation = useMutation({
    mutationFn: (id: string | number) => taskRepo.delete(id),
    onSuccess: async (_, variables) => {
      // Cancel all reminders for the deleted task
      if (settings.notifications) {
        try {
          await ReminderService.cancelTaskReminders(variables);
        } catch (error) {
          console.error("Failed to cancel task reminders:", error);
        }
      }
      invalidateTaskQueries();
    },
    onError: (error) => {
      console.error("Failed to delete task:", error);
      throw error;
    },
  });

  const materializeVirtualTask = async (task: Task): Promise<Task> => {
    const cancelReminder = settings.notifications
      ? (virtualTaskId: string) =>
          cancelVirtualReminder(reminderRegistry, virtualTaskId)
      : undefined;

    const created = await materializeVirtualTaskFn(
      task,
      taskRepo,
      recurringRepo,
      cancelReminder
    );

    if (settings.notifications && created.atTime?.includes(":")) {
      try {
        await ReminderService.scheduleTaskReminders(
          created,
          settings.reminderMinutesBefore ?? 15
        );
      } catch (error) {
        logger.error(
          "Failed to schedule reminders for materialized task:",
          error
        );
      }
    }
    invalidateTaskQueries();

    return created;
  };

  const deleteRecurringTaskSeries = async (
    recurringTaskId: string | number
  ) => {
    await taskRepo.deletePendingByRecurringTaskId(recurringTaskId);
    // Also delete the template document
    try {
      await recurringRepo.delete(recurringTaskId);
    } catch (err) {
      logger.error("Failed to delete recurring task template:", err);
    }
    invalidateTaskQueries();
  };

  const contextValue: TaskContextType = {
    task,
    createTask: (input: TaskCreateInput) =>
      createTaskMutation.mutateAsync(input),
    updateTask: (id: string | number, input: TaskUpdateInput) =>
      updateTaskMutation.mutateAsync({ id, input }),
    deleteTask: (id: string | number) => deleteTaskMutation.mutateAsync(id),
    deleteRecurringTaskSeries,
    getTask: (id: string | number) => taskRepo.findById(id),
    completeTask: (id: string | number) => completeTaskMutation.mutateAsync(id),
    reopenTask: (id: string | number) => reopenTaskMutation.mutateAsync(id),
    materializeVirtualTask,
    reset: () => setTask(null),
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
