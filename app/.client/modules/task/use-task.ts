import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type {
  Task,
  TaskCreateInput,
  TaskUpdateInput,
  TaskStatus,
  TaskQuery,
} from "../../../lib/types/task";
import { useEffect } from "react";
import { usePouchDB } from "../../pouchdb";

interface PouchDBTaskDocument {
  _id: string;
  _rev?: string;
  user_id: string;
  name: string;
  status: TaskStatus;
  scheduledAt?: number;
  created_at?: number;
  updated_at?: number;
}

interface TaskState {
  // Single task state (for useTask hook)
  task: Task | null;
  loading: boolean;
  error: string | null;

  // Multiple tasks state (for useTasks hook)
  tasks: Task[];
  loadingMore: boolean;
  hasMore: boolean;
  offset: number;

  // Actions for single task
  setTask: (task: Task | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;

  // Actions for multiple tasks
  setTasks: (tasks: Task[]) => void;
  setLoadingMore: (loadingMore: boolean) => void;
  setHasMore: (hasMore: boolean) => void;
  setOffset: (offset: number) => void;
  addTask: (task: Task) => void;
  updateTaskInList: (id: string, updates: Partial<Task>) => void;
  removeTaskFromList: (id: string) => void;
  resetTasks: () => void;

  // Async actions for single task
  createTask: (input: TaskCreateInput, db: any) => Promise<Task>;
  updateTask: (id: string, input: TaskUpdateInput, db: any) => Promise<Task>;
  deleteTask: (id: string, db: any) => Promise<void>;
  getTask: (id: string, db: any) => Promise<Task | null>;

  // Async actions for multiple tasks
  getTasks: (query?: TaskQuery, db?: any) => Promise<Task[]>;
  getTasksByDate: (date: string, db?: any) => Promise<Task[]>;
  // refreshTasks: (db?: any) => Promise<void>;
  loadMoreTasks: (db?: any) => Promise<void>;
}

export const useTaskStore = create<TaskState>()(
  devtools(
    (set, get) => ({
      loading: false,
      error: null,

      // Multiple tasks state
      tasks: [],
      loadingMore: false,
      hasMore: true,
      offset: 0,

      // Actions for single task
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),

      // Actions for multiple tasks
      setTasks: (tasks) => set({ tasks }),
      setLoadingMore: (loadingMore) => set({ loadingMore }),
      setHasMore: (hasMore) => set({ hasMore }),
      setOffset: (offset) => set({ offset }),
      addTask: (task) =>
        set((state) => ({ tasks: [task, ...state.tasks] }), false, "addTask"),
      updateTaskInList: (id, updates) =>
        set(
          (state) => ({
            tasks: state.tasks.map((task) =>
              task.id === id ? { ...task, ...updates } : task,
            ),
          }),
          false,
          "updateTaskInList",
        ),
      removeTaskFromList: (id) =>
        set(
          (state) => ({
            tasks: state.tasks.filter((task) => task.id !== id),
          }),
          false,
          "removeTaskFromList",
        ),
      resetTasks: () =>
        set(
          { tasks: [], loadingMore: false, hasMore: true, offset: 0 },
          false,
          "resetTasks",
        ),

      createTask: async (input: TaskCreateInput, db: any): Promise<Task> => {
        try {
          set({ loading: true, error: null });

          const now = Date.now();
          const taskId = input.id || `task_${crypto.randomUUID()}`;

          const newTask: Task = {
            id: taskId,
            user_id: "default-user", // You might want to get this from auth context
            name: input.name,
            status: input.status || "pending",
            scheduledAt: input.scheduledAt,
            created_at: now,
            updated_at: now,
          };

          const doc: PouchDBTaskDocument = {
            _id: taskId,
            user_id: newTask.user_id,
            name: newTask.name,
            status: newTask.status,
            scheduledAt: newTask.scheduledAt,
            created_at: newTask.created_at,
            updated_at: newTask.updated_at,
          };

          await db.put(doc);
          set({ task: newTask });

          // Also add to the tasks list
          get().addTask(newTask);

          return newTask;
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Failed to create task";
          set({ error: errorMessage });
          throw new Error(errorMessage);
        } finally {
          set({ loading: false });
        }
      },

      updateTask: async (
        id: string,
        input: TaskUpdateInput,
        db: any,
      ): Promise<Task> => {
        try {
          set({ loading: true, error: null });

          const existingDoc: PouchDBTaskDocument = await db.get(id);

          const updateData: PouchDBTaskDocument = {
            ...existingDoc,
            updated_at: Date.now(),
          };

          if (input.name !== undefined) {
            updateData.name = input.name;
          }

          if (input.status !== undefined) {
            updateData.status = input.status;
          }

          if (input.scheduledAt !== undefined) {
            updateData.scheduledAt = input.scheduledAt;
          }

          const response = await db.put(updateData);
          const updatedDoc: PouchDBTaskDocument = {
            ...updateData,
            _rev: response.rev,
          };

          const updatedTask: Task = {
            id: updatedDoc._id,
            user_id: updatedDoc.user_id,
            name: updatedDoc.name,
            status: updatedDoc.status,
            scheduledAt: updatedDoc.scheduledAt,
            created_at: updatedDoc.created_at,
            updated_at: updatedDoc.updated_at,
          };

          // set({ task: updatedTask });

          // Also update in the tasks list
          // get().updateTaskInList(id, updatedTask);

          return updatedTask;
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Failed to update task";
          set({ error: errorMessage });
          throw new Error(errorMessage);
        } finally {
          set({ loading: false });
        }
      },

      deleteTask: async (id: string, db: any): Promise<void> => {
        try {
          set({ loading: true, error: null });

          const doc: PouchDBTaskDocument = await db.get(id);
          // Ensure _rev is present before removing
          if (!doc._rev) {
            throw new Error("Document revision is required for deletion");
          }
          await db.remove(doc as any);

          // Clear the current task if it matches the deleted task
          const { task } = get();
          if (task && task.id === id) {
            set({ task: null });
          }

          // Also remove from the tasks list
          get().removeTaskFromList(id);
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Failed to delete task";
          set({ error: errorMessage });
          throw new Error(errorMessage);
        } finally {
          set({ loading: false });
        }
      },

      getTask: async (id: string, db: any): Promise<Task | null> => {
        try {
          set({ loading: true, error: null });

          const doc: PouchDBTaskDocument = await db.get(id);
          const retrievedTask: Task = {
            id: doc._id,
            user_id: doc.user_id,
            name: doc.name,
            status: doc.status,
            scheduledAt: doc.scheduledAt,
            created_at: doc.created_at,
            updated_at: doc.updated_at,
          };

          // set({ task: retrievedTask });
          return retrievedTask;
        } catch (err) {
          if ((err as any).status === 404) {
            // set({ task: null });
            return null;
          }
          const errorMessage =
            err instanceof Error ? err.message : "Failed to get task";
          set({ error: errorMessage });
          throw new Error(errorMessage);
        } finally {
          set({ loading: false });
        }
      },

      // Async actions for multiple tasks
      getTasks: async (query?: TaskQuery, db?: any): Promise<Task[]> => {
        if (!db) {
          throw new Error("Database instance is required");
        }

        try {
          set({ loading: true, error: null });

          const result = await db.allDocs({
            include_docs: true,
            attachments: true,
            startkey: "task_",
            endkey: "task_\uffff",
          });

          let tasksList = result.rows
            .filter((row: any) => row.doc && row.doc._id.startsWith("task_"))
            .map((row: any) => {
              const doc: PouchDBTaskDocument = row.doc;
              return {
                id: doc._id,
                user_id: doc.user_id,
                name: doc.name,
                status: doc.status,
                scheduledAt: doc.scheduledAt,
                created_at: doc.created_at,
                updated_at: doc.updated_at,
              };
            });

          // Filter by id if provided
          if (query?.id) {
            tasksList = tasksList.filter((task: Task) => task.id === query.id);
          }

          // Filter by status if provided
          if (query?.status) {
            tasksList = tasksList.filter(
              (task: Task) => task.status === query.status,
            );
          }

          set({ tasks: tasksList });
          return tasksList;
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Failed to get tasks";
          set({ error: errorMessage });
          throw new Error(errorMessage);
        } finally {
          set({ loading: false });
        }
      },

      getTasksByDate: async (date: string, db?: any): Promise<Task[]> => {
        if (!db) {
          throw new Error("Database instance is required");
        }

        try {
          set({ loading: true, error: null });

          const result = await db.allDocs({
            include_docs: true,
            attachments: true,
            startkey: "task_",
            endkey: "task_\uffff",
          });

          const tasksList = result.rows
            .filter((row: any) => row.doc && row.doc._id.startsWith("task_"))
            .map((row: any) => {
              const doc: PouchDBTaskDocument = row.doc;
              return {
                id: doc._id,
                user_id: doc.user_id,
                name: doc.name,
                status: doc.status,
                scheduledAt: doc.scheduledAt,
                created_at: doc.created_at,
                updated_at: doc.updated_at,
              };
            });

          // Filter by scheduled date
          const filteredTasks = tasksList.filter((task: Task) => {
            if (!task.scheduledAt) return false;

            // Parse the scheduled date and compare with the provided date
            const taskDate = new Date(task.scheduledAt)
              .toISOString()
              .split("T")[0];
            const providedDate = new Date(date).toISOString().split("T")[0];

            return taskDate === providedDate;
          });

          return filteredTasks;
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Failed to get tasks by date";
          set({ error: errorMessage });
          throw new Error(errorMessage);
        } finally {
          set({ loading: false });
        }
      },

      loadMoreTasks: async (db?: any): Promise<void> => {
        if (!db) {
          throw new Error("Database instance is required");
        }

        const { loadingMore, hasMore, offset } = get();

        if (loadingMore || !hasMore) return;

        const PAGE_SIZE = 20;

        try {
          set({ loadingMore: true });

          const result = await db.allDocs({
            include_docs: true,
            attachments: true,
            skip: offset,
            limit: PAGE_SIZE,
            startkey: "task_",
            endkey: "task_\uffff",
          });

          const newTasks = result.rows
            .filter((row: any) => row.doc && row.doc._id.startsWith("task_"))
            .map((row: any) => {
              const doc: PouchDBTaskDocument = row.doc;
              return {
                id: doc._id,
                user_id: doc.user_id,
                name: doc.name,
                status: doc.status,
                scheduledAt: doc.scheduledAt,
                created_at: doc.created_at,
                updated_at: doc.updated_at,
              };
            });

          const { tasks } = get();
          set({
            tasks: [...tasks, ...newTasks],
            hasMore: result.rows.length >= PAGE_SIZE,
            offset: offset + PAGE_SIZE,
          });
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Failed to load more tasks";
          set({ error: errorMessage });
          throw new Error(errorMessage);
        } finally {
          set({ loadingMore: false });
        }
      },
    }),
    {
      name: "task-store",
    },
  ),
);

export interface UseTaskReturn {
  task: Task | null;
  loading: boolean;
  error: string | null;
  createTask: (input: TaskCreateInput) => Promise<Task>;
  updateTask: (id: string, input: TaskUpdateInput) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  getTask: (id: string) => Promise<Task | null>;
  reset: () => void;
}

export const useTask = (taskId?: string): UseTaskReturn => {
  const { db } = usePouchDB();
  const store = useTaskStore();

  // useEffect(() => {
  //   if (taskId) {
  //     store.getTask(taskId, db).then((fetchedTask) => {
  //       if (fetchedTask) {
  //         console.log(fetchedTask.name);
  //         store.setTask(fetchedTask);
  //       }
  //     });
  //   }
  // }, [taskId]);

  return {
    task: store.task,
    loading: store.loading,
    error: store.error,
    createTask: (input: TaskCreateInput) => store.createTask(input, db),
    updateTask: (id: string, input: TaskUpdateInput) =>
      store.updateTask(id, input, db),
    deleteTask: (id: string) => store.deleteTask(id, db),
    getTask: (id: string) => store.getTask(id, db),
    reset: store.reset,
  };
};
