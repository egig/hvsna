import { create } from "zustand";
import { devtools } from "zustand/middleware";
import PouchDB from "pouchdb";
import "pouchdb-find";
import type {
  Task,
  TaskCreateInput,
  TaskUpdateInput,
  TaskStatus,
  TaskQuery,
} from "../../lib/types/task";

interface PouchDBTaskDocument {
  _id: string;
  _rev?: string;
  type: "task";
  userId?: string;
  name: string;
  status: TaskStatus;
  scheduledAtEpochMillis?: number;
  targetId?: string;
  targetValue?: number;
  createdAt?: number;
  updatedAt?: number;
  attributes?: Record<string, any>;
  hijriDate?: string;
  hour?: number;
  hijriDateYear?: number;
  hijriDateMonth?: number;
  hijriDateDay?: number;
  minute?: number;
}

interface TaskState {
  // Single task state (for useTask hook)
  task: Task | null;
  loading: boolean;
  error: string | null;

  // Form state management
  editingTaskId: string | null;
  formOpen: boolean;

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

  // Actions for form state
  setEditingTaskId: (taskId: string | null) => void;
  setFormOpen: (open: boolean) => void;
  openTaskForm: (taskId?: string) => void;
  closeTaskForm: () => void;

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
  getTasksByHijriDate: (hijriDate: string, db?: any) => Promise<Task[]>;
  // refreshTasks: (db?: any) => Promise<void>;
  loadMoreTasks: (db?: any) => Promise<void>;
}

export const useTaskStore = create<TaskState>()(
  devtools(
    (set, get) => ({
      loading: false,
      error: null,

      // Form state
      editingTaskId: null,
      formOpen: false,

      // Multiple tasks state
      tasks: [],
      loadingMore: false,
      hasMore: true,
      offset: 0,

      // Actions for single task
      setTask: (task: Task | null) => set({ task }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      reset: () => set({ task: null, loading: false, error: null }),

      // Actions for form state
      setEditingTaskId: (editingTaskId) => set({ editingTaskId }),
      setFormOpen: (formOpen) => set({ formOpen }),
      openTaskForm: (taskId) =>
        set({ editingTaskId: taskId || null, formOpen: true }),
      closeTaskForm: () => set({ editingTaskId: null, formOpen: false }),

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
            name: input.name,
            status: input.status || "pending",
            scheduledAtEpochMillis: input.scheduledAtEpochMillis,
            targetId: input.targetId || "",
            targetValue: input.targetValue || 0,
            createdAt: now,
            updatedAt: now,
            attributes: input.attributes || {},
            hijriDate: input.hijriDate || "",
            hour: input.hour || 0,
            hijriDateYear: input.hijriDateYear || 0,
            hijriDateMonth: input.hijriDateMonth || 0,
            hijriDateDay: input.hijriDateDay || 0,
            minute: input.minute || 0,
          };

          const doc: PouchDBTaskDocument = {
            _id: taskId,
            type: "task",
            userId: newTask.userId,
            name: newTask.name,
            status: newTask.status,
            scheduledAtEpochMillis: newTask.scheduledAtEpochMillis,
            targetId: newTask.targetId,
            targetValue: newTask.targetValue,
            createdAt: newTask.createdAt,
            updatedAt: newTask.updatedAt,
            attributes: newTask.attributes,
            hijriDate: newTask.hijriDate,
            hour: newTask.hour,
            hijriDateYear: newTask.hijriDateYear,
            hijriDateMonth: newTask.hijriDateMonth,
            hijriDateDay: newTask.hijriDateDay,
            minute: newTask.minute,
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
            updatedAt: Date.now(),
          };

          if (input.name !== undefined) {
            updateData.name = input.name;
          }

          if (input.status !== undefined) {
            updateData.status = input.status;
          }

          if (input.scheduledAtEpochMillis !== undefined) {
            updateData.scheduledAtEpochMillis = input.scheduledAtEpochMillis;
          }

          if (input.targetId !== undefined) {
            updateData.targetId = input.targetId;
          }

          if (input.targetValue !== undefined) {
            updateData.targetValue = input.targetValue;
          }

          if (input.attributes !== undefined) {
            updateData.attributes = input.attributes;
          }

          if (input.hijriDate !== undefined) {
            updateData.hijriDate = input.hijriDate;
          }

          if (input.hour !== undefined) {
            updateData.hour = input.hour;
          }

          if (input.hijriDateYear !== undefined) {
            updateData.hijriDateYear = input.hijriDateYear;
          }

          if (input.hijriDateMonth !== undefined) {
            updateData.hijriDateMonth = input.hijriDateMonth;
          }

          if (input.hijriDateDay !== undefined) {
            updateData.hijriDateDay = input.hijriDateDay;
          }

          if (input.minute !== undefined) {
            updateData.minute = input.minute;
          }

          const response = await db.put(updateData);
          const updatedDoc: PouchDBTaskDocument = {
            ...updateData,
            _rev: response.rev,
          };

          const updatedTask: Task = {
            id: updatedDoc._id,
            userId: updatedDoc.userId,
            name: updatedDoc.name,
            status: updatedDoc.status,
            scheduledAtEpochMillis: updatedDoc.scheduledAtEpochMillis,
            targetId: updatedDoc.targetId,
            targetValue: updatedDoc.targetValue,
            createdAt: updatedDoc.createdAt,
            updatedAt: updatedDoc.updatedAt,
            attributes: updatedDoc.attributes,
            hijriDate: updatedDoc.hijriDate,
            hour: updatedDoc.hour,
            hijriDateYear: updatedDoc.hijriDateYear,
            hijriDateMonth: updatedDoc.hijriDateMonth,
            hijriDateDay: updatedDoc.hijriDateDay,
            minute: updatedDoc.minute,
          };

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
            name: doc.name,
            status: doc.status,
            scheduledAtEpochMillis: doc.scheduledAtEpochMillis,
            targetId: doc.targetId,
            targetValue: doc.targetValue,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
            attributes: doc.attributes,
            hijriDate: doc.hijriDate,
            hour: doc.hour,
            hijriDateYear: doc.hijriDateYear,
            hijriDateMonth: doc.hijriDateMonth,
            hijriDateDay: doc.hijriDateDay,
            minute: doc.minute,
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

          await db.createIndex({
            index: {
              fields: [
                "type",
                "status",
                "targetId",
                "hijriDateYear",
                "hijriDateMonth",
                "hijriDateDay",
                "scheduledAtEpochMillis",
              ],
            },
          });

          // Build mango query
          const mangoQuery: any = {
            selector: {
              type: "task",
              status: "pending",
              targetId: {
                $gte: null,
              },
              hijriDateYear: {
                $gte: null,
              },
              hijriDateMonth: {
                $gte: null,
              },
              hijriDateDay: {
                $gte: null,
              },
              scheduledAtEpochMillis: {
                $gte: null,
              },
            },
            sort: [
              { type: "asc" },
              { status: "asc" },
              { targetId: "asc" },
              { hijriDateYear: "asc" },
              { hijriDateMonth: "asc" },
              { hijriDateDay: "asc" },
              { scheduledAtEpochMillis: "asc" },
            ],
          };

          if (query?.status) {
            mangoQuery.selector.status = query.status;
          }

          if (query?.targetId) {
            mangoQuery.selector.targetId = query.targetId;
          }

          const result = await db.find(mangoQuery);

          const tasksList = result.docs.map((doc: PouchDBTaskDocument) => ({
            id: doc._id,
            name: doc.name,
            status: doc.status,
            scheduledAtEpochMillis: doc.scheduledAtEpochMillis,
            targetId: doc.targetId,
            targetValue: doc.targetValue,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
            hijriDate: doc.hijriDate,
            hour: doc.hour,
            hijriDateYear: doc.hijriDateYear,
            hijriDateMonth: doc.hijriDateMonth,
            hijriDateDay: doc.hijriDateDay,
            minute: doc.minute,
          }));

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

          // Convert date to timestamp range for the entire day
          const startDate = new Date(date);
          startDate.setHours(0, 0, 0, 0);
          const endDate = new Date(date);
          endDate.setHours(23, 59, 59, 999);

          const mangoQuery = {
            selector: {
              _id: { $regex: "^task_" },
              scheduledAtEpochMillis: {
                $gte: startDate.getTime(),
                $lte: endDate.getTime(),
              },
            },
            sort: [{ scheduledAtEpochMillis: "asc" }],
          };

          const result = await db.find(mangoQuery);

          const tasksList = result.docs.map((doc: PouchDBTaskDocument) => ({
            id: doc._id,
            userId: doc.userId,
            name: doc.name,
            status: doc.status,
            scheduledAtEpochMillis: doc.scheduledAtEpochMillis,
            targetId: doc.targetId,
            targetValue: doc.targetValue,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
            hijriDate: doc.hijriDate,
            hour: doc.hour,
            hijriDateYear: doc.hijriDateYear,
            hijriDateMonth: doc.hijriDateMonth,
            hijriDateDay: doc.hijriDateDay,
            minute: doc.minute,
          }));

          return tasksList;
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Failed to get tasks by date";
          set({ error: errorMessage });
          throw new Error(errorMessage);
        } finally {
          set({ loading: false });
        }
      },

      getTasksByHijriDate: async (
        hijriDate: string,
        db?: any,
      ): Promise<Task[]> => {
        if (!db) {
          throw new Error("Database instance is required");
        }

        try {
          set({ loading: true, error: null });

          await db.createIndex({
            index: {
              fields: ["type", "hijriDate", "hour", "minute"],
              ddoc: "tasks",
            },
          });

          const mangoQuery = {
            selector: {
              type: "task",
              hijriDate: hijriDate,
              hour: {
                $gt: 0,
              },
              minute: {
                $gt: 0,
              },
            },
            sort: [
              { type: "asc" },
              { hijriDate: "desc" },
              { hour: "asc" },
              { minute: "asc" },
            ],
          };

          const result = await db.find(mangoQuery);

          const tasksList = result.docs.map((doc: PouchDBTaskDocument) => ({
            id: doc._id,
            userId: doc.userId,
            name: doc.name,
            status: doc.status,
            scheduledAtEpochMillis: doc.scheduledAtEpochMillis,
            targetId: doc.targetId,
            targetValue: doc.targetValue,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
            hijriDate: doc.hijriDate,
            hour: doc.hour,
            hijriDateYear: doc.hijriDateYear,
            hijriDateMonth: doc.hijriDateMonth,
            hijriDateDay: doc.hijriDateDay,
            minute: doc.minute,
          }));

          return tasksList;
        } catch (err) {
          const errorMessage =
            err instanceof Error
              ? err.message
              : "Failed to get tasks by Hijri date";
          console.log(err);
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

          const mangoQuery = {
            selector: {
              _id: { $regex: "^task_" },
            },
            sort: [{ _id: "asc" }],
            limit: PAGE_SIZE,
            skip: offset,
          };

          const result = await db.find(mangoQuery);

          const newTasks = result.docs.map((doc: PouchDBTaskDocument) => ({
            id: doc._id,
            userId: doc.userId,
            name: doc.name,
            status: doc.status,
            scheduledAtEpochMillis: doc.scheduledAtEpochMillis,
            targetId: doc.targetId,
            targetValue: doc.targetValue,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
            hijriDate: doc.hijriDate,
            hour: doc.hour,
            minute: doc.minute,
          }));

          const { tasks } = get();
          set({
            tasks: [...tasks, ...newTasks],
            hasMore: result.docs.length >= PAGE_SIZE,
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
