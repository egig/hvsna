import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { useMutation } from "@tanstack/react-query";
import type { Task, TaskCreateInput, TaskUpdateInput } from "@/domain/task";
import { usePouchDB } from "../../pouchdb";
import { createTaskUseCases } from "../../usecases/task";
import { createRecurringTaskUseCases } from "@/usecases/task/RecurringTaskUseCasesFactory";
import { ReminderService } from "./reminder-service";
import { useSettings } from "../settings";
import { useTaskReminder } from "./recurring-reminder-scheduler";
import type { RecurringTask } from "./recurring-task";
import { useInvalidateTaskQueries } from "./use-invalidate-task-queries";
import logger from "../logger";

interface TaskContextType {
  // Task data
  task: Task | null;

  createTask: (input: TaskCreateInput) => Promise<Task>;
  updateTask: (id: string, input: TaskUpdateInput) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  deleteRecurringTaskSeries: (recurringTaskId: string) => Promise<void>;
  getTask: (id: string) => Promise<Task | null>;
  completeTask: (id: string) => Promise<Task>;
  reopenTask: (id: string) => Promise<Task>;
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
  const { db } = usePouchDB();
  const taskUseCases = createTaskUseCases(db);
  const [task, setTask] = useState<Task | null>(null);
  const scheduleRecurringTaskReminders = useTaskReminder();

  useEffect(() => {
    if (taskId) {
      taskUseCases.getTaskById(taskId).then((fetchedTask: Task | null) => {
        if (fetchedTask) {
          setTask(fetchedTask);
        }
      });
    }
  }, [taskId, taskUseCases]);

  // Schedule reminders for virtual recurring task occurrences on startup
  useEffect(() => {
    db.allDocs({ include_docs: true, startkey: "rtask_", endkey: "rtask_￿" })
      .then((response) => {
        const templates = response.rows
          .filter((row: any) => row.doc && row.doc.baseDateEpoch)
          .map(
            (row: any) =>
              ({
                ...row.doc,
                id: row.doc._id || row.doc.id || "",
                occurrenceExceptions: row.doc.occurrence_exceptions,
              } as RecurringTask)
          );
        return scheduleRecurringTaskReminders(db, templates);
      })
      .catch((err) =>
        logger.error("Failed to schedule recurring task reminders:", err)
      );
  }, [db]);

  const updateTaskWithLog = async (
    id: string,
    input: TaskUpdateInput
  ): Promise<Task> => {
    // Update the task
    const updatedTask = await taskUseCases.updateTask(id, input);
    return updatedTask;
  };

  // React Query mutation for completing tasks
  const completeTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      return taskUseCases.completeTask(id);
    },
    onSuccess: async (updatedTask: Task, id) => {
      // Mark this occurrence as an exception so the generator skips it
      if (updatedTask.recurringTaskId && updatedTask.atEpochMillis) {
        try {
          await createRecurringTaskUseCases(db).addOccurrenceException(
            updatedTask.recurringTaskId,
            updatedTask.atEpochMillis
          );
        } catch (err) {
          logger.error("Failed to update occurrence exceptions on complete:", err);
        }
      }

      // Cancel reminders when task is completed
      if (settings.notifications) {
        try {
          await ReminderService.cancelTaskReminders(id);
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
    mutationFn: (id: string) => taskUseCases.uncompleteTask(id),
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
    mutationFn: (input: TaskCreateInput) => taskUseCases.createTask(input),
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
    mutationFn: ({ id, input }: { id: string; input: TaskUpdateInput }) =>
      updateTaskWithLog(id, input),
    onSuccess: async (_, variables) => {
      // Update reminders if notifications are enabled
      if (settings.notifications) {
        try {
          const updatedTask = await taskUseCases.getTaskById(variables.id);
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
    mutationFn: (id: string) => taskUseCases.deleteTask(id),
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
    if (!task.isVirtual) return task;
    return createTaskMutation.mutateAsync({
      name: task.name || "",
      description: task.description,
      atEpochMillis: task.atEpochMillis,
      atTime: task.atTime,
      lat: task.lat,
      long: task.long,
      timezone: task.timezone,
      hijriDateOffset: task.hijriDateOffset,
      recurringType: task.recurringType,
      recurringInterval: task.recurringInterval,
      recurringTaskId: task.recurringTaskId ?? undefined,
      tags: task.tags ?? [],
    });
  };

  const deleteRecurringTaskSeries = async (recurringTaskId: string) => {
    await taskUseCases.deletePendingByRecurringTaskId(recurringTaskId);
    // Also delete the template document
    try {
      const templateDoc = await db.get(recurringTaskId);
      await db.remove(templateDoc as any);
    } catch (err) {
      logger.error("Failed to delete recurring task template:", err);
    }
    invalidateTaskQueries();
  };

  const contextValue: TaskContextType = {
    task,
    createTask: (input: TaskCreateInput) =>
      createTaskMutation.mutateAsync(input),
    updateTask: (id: string, input: TaskUpdateInput) =>
      updateTaskMutation.mutateAsync({ id, input }),
    deleteTask: (id: string) => deleteTaskMutation.mutateAsync(id),
    deleteRecurringTaskSeries,
    getTask: (id: string) => taskUseCases.getTaskById(id),
    completeTask: (id: string) => completeTaskMutation.mutateAsync(id),
    reopenTask: (id: string) => reopenTaskMutation.mutateAsync(id),
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
