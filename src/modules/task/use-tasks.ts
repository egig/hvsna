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
import { useLog } from "../log/use-log";
import { useGoal } from "../goal/use-goal";

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
}

export const useTasks = (): UseTasksReturn => {
  const { db } = usePouchDB();
  const store = useTaskStore();
  const { createLog } = useLog();
  const { getGoal } = useGoal();

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
      return store.getTasksByDate(date, db);
    },
    [store, db],
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
  };
};
