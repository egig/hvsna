import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Task, TaskCreateInput, TaskUpdateInput } from "./types";
import { usePouchDB } from "../../pouchdb";
import { createTaskUseCases } from "../../usecases/task";
import { queryKeys } from "../query-keys";
import { useHijriDate } from "../calendar/hijri/use-hijri-date";
import { ReminderService } from "./reminder-service";
import { useSettings } from "../settings/useSettings";
import {
  generateAllRecurringTaskOccurrences,
  generateOccurrencesForTemplate,
} from "./recurring-task-generator";
import { PouchDBTaskRepository } from "../../infra/task/PouchDBTaskRepository";
import type { RecurringTask } from "./recurring-task";
import logger from "../logger";

interface TaskContextType {
  // Task data
  task: Task | null;

  // CRUD operations
  createTask: (input: TaskCreateInput) => Promise<Task>;
  updateTask: (id: string, input: TaskUpdateInput) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  deleteRecurringTaskSeries: (recurringTaskId: string) => Promise<void>;
  getTask: (id: string) => Promise<Task | null>;
  completeTask: (id: string) => Promise<Task>;
  reopenTask: (id: string) => Promise<Task>;
  reset: () => void;
  generateOccurrencesForTemplate: (template: RecurringTask) => Promise<void>;

  // Form state management
  editingTaskId: string | null;
  formOpen: boolean;
  openCreateTaskForm: (options?: { listId?: string }) => void;
  openEditTaskForm: (taskId: string, options?: { listId?: string }) => void;
  closeTaskForm: () => void;
  setEditingTaskId: (taskId: string | null) => void;
  preselectedListId: string | null;

  // Legacy compatibility
  refreshAllTaskLists: (today: any) => Promise<void>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{
  children: ReactNode;
  taskId?: string;
}> = ({ children, taskId }) => {
  const queryClient = useQueryClient();
  const { getToday } = useHijriDate();
  const { settings } = useSettings();
  const { db } = usePouchDB();
  const taskUseCases = createTaskUseCases(db);
  const [task, setTask] = useState<Task | null>(null);

  // Local form state
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState<boolean>(false);
  const [preselectedListId, setPreselectedListId] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (taskId) {
      taskUseCases.getTaskById(taskId).then((fetchedTask: Task | null) => {
        if (fetchedTask) {
          setTask(fetchedTask);
        }
      });
    }
  }, [taskId, taskUseCases]);

  // Generate missing recurring task occurrences on startup
  useEffect(() => {
    const taskRepository = new PouchDBTaskRepository(db);
    generateAllRecurringTaskOccurrences(db, taskRepository, Date.now()).catch(
      (err) =>
        logger.error("Failed to generate recurring task occurrences:", err)
    );
  }, [db]);

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
    queryClient.invalidateQueries({ queryKey: queryKeys.inboxTasks() });
    queryClient.invalidateQueries({ queryKey: ["list-tasks"] });
    queryClient.invalidateQueries({ queryKey: queryKeys.allTasks() });
  };

  // Local form functions
  const openCreateTaskForm = (options?: { listId?: string }) => {
    setEditingTaskId(null);
    setPreselectedListId(options?.listId || null);
    setFormOpen(true);
  };

  const openEditTaskForm = (taskId: string, options?: { listId?: string }) => {
    setEditingTaskId(taskId);
    setPreselectedListId(options?.listId || null);
    setFormOpen(true);
  };

  const closeTaskForm = () => {
    setEditingTaskId(null);
    setPreselectedListId(null);
    setFormOpen(false);
  };

  const updateTaskWithLog = async (
    id: string,
    input: TaskUpdateInput
  ): Promise<Task> => {
    // Get the current task before updating to check status change
    const currentTask = await taskUseCases.getTaskById(id);

    // Update the task
    const updatedTask = await taskUseCases.updateTask(id, input);
    return updatedTask;
  };

  // React Query mutation for completing tasks
  const completeTaskMutation = useMutation({
    mutationFn: (id: string) => taskUseCases.completeTask(id),
    onSuccess: async (updatedTask: Task, id) => {
      // Cancel reminders when task is completed
      if (settings.notifications) {
        try {
          await ReminderService.cancelTaskReminders(id);
        } catch (error) {
          logger.error("Failed to cancel task reminders:", error);
        }
      }

      invalidateTaskQueries();
      try {
        const currentTask = await taskUseCases.getTaskById(id);
        if (currentTask?.status === 1) {
          return; // Already completed
        }
      } catch (logError) {
        console.warn("Failed to create log for task completion:", logError);
      }
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
      // Reschedule reminders when task is reopened
      if (settings.notifications && updatedTask.atEpochMillis) {
        try {
          await ReminderService.updateTaskReminders(updatedTask);
        } catch (error) {
          logger.error("Failed to reschedule task reminders:", error);
        }
      }

      invalidateTaskQueries();

      try {
        const currentTask = await taskUseCases.getTaskById(id);
        if (currentTask?.status === 0) {
          return; // Already pending
        }
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
    mutationFn: (input: TaskCreateInput) => taskUseCases.createTask(input),
    onSuccess: async (createdTask: Task) => {
      // Schedule reminders if notifications are enabled and task has scheduled time
      if (settings.notifications && createdTask.atEpochMillis) {
        try {
          await ReminderService.scheduleTaskReminders(createdTask);
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
              await ReminderService.updateTaskReminders(updatedTask);
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
      setFormOpen(false);
    },
    onError: (error) => {
      console.error("Failed to delete task:", error);
      throw error;
    },
  });

  // React Query mutation for generating recurring task occurrences
  const generateOccurrencesMutation = useMutation({
    mutationFn: async (template: RecurringTask) => {
      const taskRepository = new PouchDBTaskRepository(db);
      await generateOccurrencesForTemplate(
        template,
        taskRepository,
        Date.now()
      );
    },
    onSuccess: () => {
      invalidateTaskQueries();
    },
    onError: (error) => {
      logger.error("Failed to generate recurring task occurrences:", error);
      throw error;
    },
  });

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
    reset: () => setTask(null),
    generateOccurrencesForTemplate: (template: RecurringTask) =>
      generateOccurrencesMutation.mutateAsync(template),
    editingTaskId,
    formOpen,
    openCreateTaskForm,
    openEditTaskForm,
    closeTaskForm,
    setEditingTaskId,
    preselectedListId,
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
