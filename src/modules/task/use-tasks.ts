import { useEffect, useCallback } from "react";
import type {
  Task,
  TaskCreateInput,
  TaskUpdateInput,
  TaskQuery,
  TaskStatus,
} from "../../lib/types/task";
import { usePouchDB } from "../../pouchdb";
import { useTaskStore } from "./task-store";
import { taskRepository } from "./task-repository";
import { useLog } from "../log/use-log";
import { useGoal } from "../goal/use-goal";
import { useRecurringTasks } from "../../hooks/useRecurringTasks";
import type { RecurringTask } from "../../lib/types/recurring-task";
import { HijriDate } from "../../lib/hijri/hijri-date";
import { HijriMonth } from "../../lib/hijri/hijri-month";

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
  getTasksByHijriDate: (hijriDate: string) => Promise<Task[]>;
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
    return store.loadMoreTasks();
  }, [store]);

  const createTask = useCallback(
    async (input: TaskCreateInput): Promise<Task> => {
      return store.createTask(input);
    },
    [store],
  );

  const updateTask = useCallback(
    async (id: string, input: TaskUpdateInput): Promise<Task> => {
      return store.updateTask(id, input);
    },
    [store],
  );

  const deleteTask = useCallback(
    async (id: string): Promise<void> => {
      return store.deleteTask(id);
    },
    [store],
  );

  const getTask = useCallback(
    async (id: string): Promise<Task | null> => {
      return store.getTask(id);
    },
    [store],
  );

  const getTasks = useCallback(
    async (query?: TaskQuery): Promise<Task[]> => {
      return store.getTasks(query);
    },
    [store],
  );

  const getTasksByDate = useCallback(
    async (date: string): Promise<Task[]> => {
      try {
        // Get normal tasks for the date
        const normalTasks = await store.getTasksByDate(date);

        // Get recurring tasks and generate instances for this date
        const recurringTasks = await getRecurringTasksFromHook();
        const targetDate = new Date(date);
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);

        const recurringInstances: Task[] = [];

        for (const recurringTask of recurringTasks) {
          const occurrences = getRecurringOccurrences(
            recurringTask,
            startOfDay,
            endOfDay,
          );

          for (const occurrence of occurrences) {
            // Check if this recurring task instance already exists
            const exists = normalTasks.some(
              (task) =>
                task.name === recurringTask.name &&
                task.scheduledAtEpochMillis === occurrence.getTime(),
            );

            if (!exists) {
              // Create a virtual task instance (not saved to DB)
              const virtualTask: Task = {
                id: `recurring_${recurringTask.id}_${occurrence.getTime()}`,
                name: recurringTask.name,
                status: "pending",
                scheduledAtEpochMillis: occurrence.getTime(),
                targetId: recurringTask.targetId,
                targetValue: recurringTask.targetValue,
                attributes: recurringTask.attributes,
                createdAt: Date.now(),
                updatedAt: Date.now(),
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
        return store.getTasksByDate(date);
      }
    },
    [store, getRecurringTasksFromHook],
  );

  const getTasksByHijriDate = useCallback(
    async (hijriDate: string): Promise<Task[]> => {
      return store.getTasksByHijriDate(hijriDate);
    },
    [store],
  );

  const refreshTasks = useCallback(async () => {
    store.resetTasks();
    await store.getTasks({});
  }, [store]);

  const updateStatus = async (
    id: string,
    status: TaskStatus,
  ): Promise<Task> => {
    // Get the current task before updating to check status change
    const currentTask = await store.getTask(id);
    if (!currentTask) {
      throw new Error("updating not existing task: " + id);
    }

    // Update the task
    const updatedTask = await store.updateTask(
      id,
      {
        status,
        hijriDate:
          currentTask.hijriDate ||
          (() => {
            const now = new Date();
            const hijriNow = HijriDate.fromDate(now);
            const year = hijriNow.year.toString().padStart(4, "0");
            const month = hijriNow.month.toString().padStart(2, "0");
            const day = hijriNow.day.toString().padStart(2, "0");
            return `${year}${month}${day}`;
          })(),
      },
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

  // Helper function to get occurrences using HijriDate
  const getRecurringOccurrences = (
    recurringTask: RecurringTask,
    startDate: Date,
    endDate: Date,
  ): Date[] => {
    const occurrences: Date[] = [];
    const baseHijriDate = HijriDate.fromDate(new Date(recurringTask.baseDate));
    const startHijriDate = HijriDate.fromDate(startDate);
    const endHijriDate = HijriDate.fromDate(endDate);

    // Generate dates based on repeat frequency
    switch (recurringTask.repeat) {
      case "daily":
        let currentDate = startHijriDate;
        while (
          currentDate.year < endHijriDate.year ||
          (currentDate.year === endHijriDate.year &&
            currentDate.month < endHijriDate.month) ||
          (currentDate.year === endHijriDate.year &&
            currentDate.month === endHijriDate.month &&
            currentDate.day <= endHijriDate.day)
        ) {
          // Check if this date matches or comes after the base date
          if (
            currentDate.toDate().getTime() >=
            new Date(recurringTask.baseDate).getTime()
          ) {
            occurrences.push(currentDate.toDate());
          }
          currentDate = currentDate.next();
        }
        break;

      case "monthly":
        // Generate monthly occurrences on the same Hijri day
        let currentMonth = new HijriMonth(
          startHijriDate.year,
          startHijriDate.month,
        );

        while (
          currentMonth.year < endHijriDate.year ||
          (currentMonth.year === endHijriDate.year &&
            currentMonth.month <= endHijriDate.month)
        ) {
          // Ensure the day exists in this month (Hijri months have 29 or 30 days)
          const maxDay = currentMonth.getDaysInMonth();
          const targetDay = Math.min(baseHijriDate.day, maxDay);
          const adjustedDate = new HijriDate(
            currentMonth.year,
            currentMonth.month,
            targetDay,
          );

          if (
            adjustedDate.toDate().getTime() >=
            new Date(recurringTask.baseDate).getTime()
          ) {
            occurrences.push(adjustedDate.toDate());
          }

          // Move to next month
          currentMonth = currentMonth.next();
        }
        break;

      case "yearly":
        // Generate yearly occurrences on the same Hijri month and day
        let currentYear = startHijriDate.year;

        while (currentYear <= endHijriDate.year) {
          // Create HijriMonth to check if the day exists in this month
          const yearMonth = new HijriMonth(currentYear, baseHijriDate.month);
          const maxDay = yearMonth.getDaysInMonth();
          const targetDay = Math.min(baseHijriDate.day, maxDay);
          const adjustedDate = new HijriDate(
            currentYear,
            baseHijriDate.month,
            targetDay,
          );

          if (
            adjustedDate.toDate().getTime() >=
            new Date(recurringTask.baseDate).getTime()
          ) {
            occurrences.push(adjustedDate.toDate());
          }

          currentYear++;
        }
        break;

      default:
        // For "none" or unsupported frequencies, return empty array
        break;
    }

    return occurrences;
  };

  // Generate recurring task instances for a date range
  const generateRecurringTasks = useCallback(
    async (startDate: Date, endDate: Date): Promise<Task[]> => {
      try {
        const recurringTasks = await getRecurringTasksFromHook();
        const generatedTasks: Task[] = [];

        for (const recurringTask of recurringTasks) {
          const occurrences = getRecurringOccurrences(
            recurringTask,
            startDate,
            endDate,
          );

          for (const occurrence of occurrences) {
            const occurrenceHijriDate = HijriDate.fromDate(occurrence);
            const year = occurrenceHijriDate.year.toString().padStart(4, "0");
            const month = occurrenceHijriDate.month.toString().padStart(2, "0");
            const day = occurrenceHijriDate.day.toString().padStart(2, "0");
            const taskData: TaskCreateInput = {
              name: recurringTask.name,
              targetId: recurringTask.targetId,
              targetValue: recurringTask.targetValue,
              attributes: recurringTask.attributes,
              hijriDate: `${year}${month}${day}`,
            };

            // Check if task already exists for this date
            const existingTasks = await getTasksByDate(
              occurrence.toISOString().split("T")[0],
            );
            const exists = existingTasks.some(
              (task) =>
                task.name === recurringTask.name &&
                task.scheduledAtEpochMillis === occurrence.getTime(),
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
    getTasksByHijriDate,
    loadMoreTasks,
    refreshTasks,
    updateStatus,
    generateRecurringTasks,
    getRecurringTasks,
  };
};
