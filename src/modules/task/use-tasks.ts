import { useEffect, useCallback } from "react";
import { RRule, rrulestr } from "rrule";
import type {
  Task,
  TaskCreateInput,
  TaskUpdateInput,
  TaskQuery,
  TaskStatus,
} from "../../lib/types/task";
import { usePouchDB } from "../../pouchdb";
import { useTaskStore } from "./task-store";
import { useLog } from "../log/use-log";
import { useGoal } from "../goal/use-goal";
import { useRecurringTasks } from "../../hooks/useRecurringTasks";
import type { RecurringTask } from "../../lib/types/recurring-task";

export interface UseTasksReturn {
  tasks: Task[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  createTask: (input: TaskCreateInput) => Promise<Task>;
  updateTask: (id: string, input: TaskUpdateInput) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  getTask: (id: string) => Promise<Task | null>;
  getTasks: (query?: TaskQuery) => Promise<Task[]>;
  getTasksByDate: (date: string) => Promise<Task[]>;
  loadMoreTasks: () => Promise<void>;
  refreshTasks: () => Promise<void>;
  updateStatus: (id: string, status: TaskStatus) => Promise<Task>;
  generateRecurringTasks: (startDate: Date, endDate: Date) => Promise<Task[]>;
  getRecurringTasks: () => Promise<RecurringTask[]>;
}

export const useTasks = (): UseTasksReturn => {
  const { db } = usePouchDB();
  const store = useTaskStore();
  const { createLog } = useLog();
  const { getGoal } = useGoal();
  const { getRecurringTasks: getRecurringTasksFromHook } = useRecurringTasks();

  useEffect(() => {
    getTasks();
  }, []);

  const loadMoreTasks = useCallback(async () => {
    return store.loadMoreTasks(db);
  }, [store, db]);

  const createTask = useCallback(
    async (input: TaskCreateInput): Promise<Task> => {
      return store.createTask(input, db);
    },
    [store, db],
  );

  const updateTask = useCallback(
    async (id: string, input: TaskUpdateInput): Promise<Task> => {
      return store.updateTask(id, input, db);
    },
    [store, db],
  );

  const deleteTask = useCallback(
    async (id: string): Promise<void> => {
      return store.deleteTask(id, db);
    },
    [store, db],
  );

  const getTask = useCallback(
    async (id: string): Promise<Task | null> => {
      return store.getTask(id, db);
    },
    [store, db],
  );

  const getTasks = useCallback(
    async (query?: TaskQuery): Promise<Task[]> => {
      return store.getTasks(query, db);
    },
    [store, db],
  );

  const getTasksByDate = useCallback(
    async (date: string): Promise<Task[]> => {
      try {
        // Get normal tasks for the date
        const normalTasks = await store.getTasksByDate(date, db);

        // Get recurring tasks and generate instances for this date
        const recurringTasks = await getRecurringTasksFromHook();
        const targetDate = new Date(date);
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);

        const recurringInstances: Task[] = [];

        for (const recurringTask of recurringTasks) {
          const rule = new RRule({
            freq: getRRuleFrequency(recurringTask.repeat),
            dtstart: new Date(recurringTask.baseDate),
          });

          const occurrences = rule.between(startOfDay, endOfDay);

          for (const occurrence of occurrences) {
            // Check if this recurring task instance already exists
            const exists = normalTasks.some(
              (task) =>
                task.name === recurringTask.name &&
                task.scheduledAt === occurrence.getTime(),
            );

            if (!exists) {
              // Create a virtual task instance (not saved to DB)
              const virtualTask: Task = {
                id: `recurring_${recurringTask.id}_${occurrence.getTime()}`,
                name: recurringTask.name,
                status: "pending",
                scheduledAt: occurrence.getTime(),
                targetId: recurringTask.targetId,
                targetValue: recurringTask.targetValue,
                attributes: recurringTask.attributes,
                created_at: Date.now(),
                updated_at: Date.now(),
              };
              recurringInstances.push(virtualTask);
            }
          }
        }

        // Combine normal tasks and recurring instances
        return [...normalTasks, ...recurringInstances];
      } catch (error) {
        console.error("Failed to get tasks by date:", error);
        // Fallback to just normal tasks if recurring task generation fails
        return store.getTasksByDate(date, db);
      }
    },
    [store, db, getRecurringTasksFromHook],
  );

  const refreshTasks = useCallback(async () => {
    store.resetTasks();
    await store.getTasks({}, db);
  }, [store, db]);

  const updateStatus = async (
    id: string,
    status: TaskStatus,
  ): Promise<Task> => {
    // Get the current task before updating to check status change
    const currentTask = await store.getTask(id, db);
    if (!currentTask) {
      throw new Error("updating not existing task: " + id);
    }

    // Update the task
    const updatedTask = await store.updateTask(
      id,
      {
        status,
      },
      db,
    );

    if (!updatedTask.targetId) {
      return updatedTask;
    }

    if (status === currentTask.status) {
      return updatedTask;
    }

    if (status === "in_progress") {
      return updatedTask;
    }

    try {
      const goal = await getGoal(updatedTask.targetId as string);
      let v = updatedTask.targetValue || 0;
      if (status !== "completed") {
        v = -1 * v;
      }

      await createLog({
        trackerId: goal.trackerId,
        timestamp: Date.now(),
        value: v,
        taskId: updatedTask.id,
        attributes: updatedTask.attributes,
      });
    } catch (logError) {
      // Log creation failure shouldn't break task update
      console.warn("Failed to create log for task status change:", logError);
    }

    return updatedTask;
  };

  // Helper function to convert repeat type to RRule frequency
  const getRRuleFrequency = (repeat: string): number => {
    switch (repeat) {
      case "daily":
        return RRule.DAILY;
      case "monthly":
        return RRule.MONTHLY;
      case "yearly":
        return RRule.YEARLY;
      default:
        return RRule.DAILY;
    }
  };

  // Generate recurring task instances for a date range
  const generateRecurringTasks = useCallback(
    async (startDate: Date, endDate: Date): Promise<Task[]> => {
      try {
        const recurringTasks = await getRecurringTasksFromHook();
        const generatedTasks: Task[] = [];

        for (const recurringTask of recurringTasks) {
          const rule = new RRule({
            freq: getRRuleFrequency(recurringTask.repeat),
            dtstart: new Date(recurringTask.baseDate),
            until: endDate,
          });

          const occurrences = rule.between(startDate, endDate);

          for (const occurrence of occurrences) {
            const taskData: TaskCreateInput = {
              name: recurringTask.name,
              targetId: recurringTask.targetId,
              targetValue: recurringTask.targetValue,
              attributes: recurringTask.attributes,
              scheduledAt: occurrence.getTime(),
            };

            // Check if task already exists for this date
            const existingTasks = await getTasksByDate(
              occurrence.toISOString().split("T")[0],
            );
            const exists = existingTasks.some(
              (task) =>
                task.name === recurringTask.name &&
                task.scheduledAt === occurrence.getTime(),
            );

            if (!exists) {
              const createdTask = await createTask(taskData);
              generatedTasks.push(createdTask);
            }
          }
        }

        return generatedTasks;
      } catch (error) {
        console.error("Failed to generate recurring tasks:", error);
        return [];
      }
    },
    [getRecurringTasksFromHook, createTask, getTasksByDate],
  );

  // Get all recurring tasks
  const getRecurringTasks = useCallback(async (): Promise<RecurringTask[]> => {
    return getRecurringTasksFromHook();
  }, [getRecurringTasksFromHook]);

  return {
    tasks: store.tasks,
    loading: store.loading,
    loadingMore: store.loadingMore,
    error: store.error,
    hasMore: store.hasMore,
    createTask,
    updateTask,
    deleteTask,
    getTask,
    getTasks,
    getTasksByDate,
    loadMoreTasks,
    refreshTasks,
    updateStatus,
    generateRecurringTasks,
    getRecurringTasks,
  };
};
