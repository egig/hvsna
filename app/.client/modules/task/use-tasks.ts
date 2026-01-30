import { useEffect, useCallback } from "react";
import type {
  Task,
  TaskCreateInput,
  TaskUpdateInput,
  TaskQuery,
} from "../../../lib/types/task";
import { usePouchDB } from "../../pouchdb";
import { useTaskStore } from "./use-task";

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
}

export const useTasks = (): UseTasksReturn => {
  const { db } = usePouchDB();
  const store = useTaskStore();


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
  };
};
