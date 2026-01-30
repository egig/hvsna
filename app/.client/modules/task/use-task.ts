import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type {
  Task,
  TaskCreateInput,
  TaskUpdateInput,
  TaskStatus,
} from "~/lib/types/task";
import { useEffect } from "react";
import { usePouchDB } from "~/.client/pouchdb";

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
  task: Task | null;
  loading: boolean;
  error: string | null;
  setTask: (task: Task | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
  createTask: (input: TaskCreateInput, db: any) => Promise<Task>;
  updateTask: (id: string, input: TaskUpdateInput, db: any) => Promise<Task>;
  deleteTask: (id: string, db: any) => Promise<void>;
  getTask: (id: string, db: any) => Promise<Task | null>;
}

export const useTaskStore = create<TaskState>()(
  devtools(
    (set, get) => ({
      task: null,
      loading: false,
      error: null,

      setTask: (task) => set({ task }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),

      reset: () => set({ task: null, loading: false, error: null }),

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

          set({ task: updatedTask });
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

          set({ task: retrievedTask });
          return retrievedTask;
        } catch (err) {
          if ((err as any).status === 404) {
            set({ task: null });
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

  useEffect(() => {
    if (taskId) {
      store.getTask(taskId, db).then((fetchedTask) => {
        if (fetchedTask) {
          console.log(fetchedTask.name);
          store.setTask(fetchedTask);
        }
      });
    }
  }, [taskId]);

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
