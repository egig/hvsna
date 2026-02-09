import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type {
  Task,
  TaskCreateInput,
  TaskUpdateInput,
  TaskStatus,
  TaskQuery,
} from "../../lib/types/task";
import { taskRepository } from "./task-repository";
import { HijriDate } from "../../lib/hijri";

interface TaskState {
  loading: boolean;
  error: string | null;

  // Form state management
  editingTaskId: string | null;
  formOpen: boolean;

  todayTasks: Task[];
  upcommingTasks: Task[];
  browsedTasks: Task[];

  // Multiple tasks state (for useTasks hook)
  tasks: Task[];
  taskCache: Record<string, Task>;
  loadingMore: boolean;
  hasMore: boolean;
  offset: number;

  // Filter state for browsed tasks
  statusFilter: number | "all";
  dateRangeFilter: { startDate: HijriDate; endDate: HijriDate } | null;
  searchTextFilter: string;

  // Actions for single task
  // setTask: (task: Task | null) => void;
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
  updateTaskInList: (id: string, updates: Partial<Task>) => void;
  removeTaskFromList: (id: string) => void;
  resetTasks: () => void;

  // Actions for filters
  setStatusFilter: (status: number | "all") => void;
  setDateRangeFilter: (
    dateRange: { startDate: HijriDate; endDate: HijriDate } | null,
  ) => void;
  setSearchTextFilter: (searchText: string) => void;
  clearFilters: () => void;

  // Async actions for single task
  createTask: (input: TaskCreateInput) => Promise<Task>;
  updateTask: (id: string, input: TaskUpdateInput) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  getTask: (id: string) => Promise<Task | null>;

  // Async actions for multiple tasks
  getTasks: (query?: TaskQuery) => Promise<Task[]>;
  getTasksByDate: (date: string) => Promise<Task[]>;
  getTasksByHijriDate: (hijriDate: string) => Promise<Task[]>;
  // refreshTasks: () => Promise<void>;
  loadMoreTasks: () => Promise<void>;

  loadTodayTasks: () => Promise<void>;
  loadUpcommingTasks: () => Promise<void>;
  loadBrowsedTasks: (reset?: boolean) => Promise<void>;
}

export const useTaskStore = create<TaskState>()(
  devtools(
    (set, get) => ({
      loading: false,
      error: null,
      editingTaskId: null,
      formOpen: false,
      tasks: [],
      loadingMore: false,
      hasMore: true,
      offset: 0,
      todayTasks: [],
      upcommingTasks: [],
      browsedTasks: [],
      taskCache: {},
      statusFilter: "all" as const,
      dateRangeFilter: null,
      searchTextFilter: "",

      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      reset: () => set({ loading: false, error: null }),

      // Actions for form state
      setEditingTaskId: (editingTaskId) => set({ editingTaskId }),
      setFormOpen: (formOpen) => set({ formOpen }),
      openTaskForm: (taskId?: string) =>
        set({ editingTaskId: taskId || null, formOpen: true }),
      closeTaskForm: () => set({ editingTaskId: null, formOpen: false }),

      // Actions for multiple tasks
      setTasks: (tasks) => set({ tasks }),
      setLoadingMore: (loadingMore) => set({ loadingMore }),
      setHasMore: (hasMore) => set({ hasMore }),
      setOffset: (offset) => set({ offset }),
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

      // Actions for filters
      setStatusFilter: (status) => {
        set({ statusFilter: status });
        get().loadBrowsedTasks(true);
      },
      setDateRangeFilter: (dateRange) => {
        set({ dateRangeFilter: dateRange });
        get().loadBrowsedTasks(true);
      },
      setSearchTextFilter: (searchText) => {
        set({ searchTextFilter: searchText });
        get().loadBrowsedTasks(true);
      },
      clearFilters: () => {
        set({
          statusFilter: "all" as const,
          dateRangeFilter: null,
          searchTextFilter: "",
        });
        get().loadBrowsedTasks(true);
      },

      createTask: async (input: TaskCreateInput): Promise<Task> => {
        try {
          set({ loading: true, error: null });

          const newTask = await taskRepository.create(input);
          get().loadTodayTasks();
          get().loadUpcommingTasks();
          get().loadBrowsedTasks();

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

      updateTask: async (id: string, input: TaskUpdateInput): Promise<Task> => {
        try {
          set({ loading: true, error: null });

          const updatedTask = await taskRepository.update(id, input);
          get().loadTodayTasks();
          get().loadUpcommingTasks();
          get().loadBrowsedTasks();

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

      deleteTask: async (id: string): Promise<void> => {
        try {
          set({ loading: true, error: null });

          await taskRepository.delete(id);
          get().removeTaskFromList(id);
          get().loadTodayTasks();
          get().loadUpcommingTasks();
          get().loadBrowsedTasks();
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Failed to delete task";
          set({ error: errorMessage });
          throw new Error(errorMessage);
        } finally {
          set({ loading: false });
        }
      },

      getTask: async (id: string): Promise<Task | null> => {
        let t = get().taskCache[id];
        if (!!t) {
          return t;
        }

        try {
          set({ loading: true, error: null });
          const task = await taskRepository.findById(id);
          let tc = Object.assign(get().taskCache, { [id]: task as Task });
          set({ taskCache: tc });

          return task;
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Failed to get task";
          set({ error: errorMessage });
          throw new Error(errorMessage);
        } finally {
          set({ loading: false });
        }
      },

      // Async actions for multiple tasks
      getTasks: async (query?: TaskQuery): Promise<Task[]> => {
        try {
          set({ loading: true, error: null });

          const tasksList = await taskRepository.find(query);
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

      getTasksByDate: async (date: string): Promise<Task[]> => {
        try {
          set({ loading: true, error: null });

          const tasksList = await taskRepository.findByDate(date);
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

      getTasksByHijriDate: async (hijriDate: string): Promise<Task[]> => {
        try {
          set({ loading: true, error: null });

          const tasksList = await taskRepository.findByHijriDate(hijriDate);
          return tasksList;
        } catch (err) {
          const errorMessage =
            err instanceof Error
              ? err.message
              : "Failed to get tasks by Hijri date";
          set({ error: errorMessage });
          throw new Error(errorMessage);
        } finally {
          set({ loading: false });
        }
      },

      loadMoreTasks: async (): Promise<void> => {
        const { loadingMore, hasMore, offset } = get();

        if (loadingMore || !hasMore) return;

        const PAGE_SIZE = 20;

        try {
          set({ loadingMore: true });

          const newTasks = await taskRepository.findWithPagination(
            offset,
            PAGE_SIZE,
          );

          const { tasks } = get();
          set({
            tasks: [...tasks, ...newTasks],
            hasMore: newTasks.length >= PAGE_SIZE,
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

      loadTodayTasks: async (): Promise<void> => {
        try {
          set({ loading: true, error: null });
          const todayTasksList = await taskRepository.findTodayTasks();
          let tc = Object.fromEntries(
            todayTasksList.map((task) => [task.id, task]),
          );
          set({ todayTasks: todayTasksList, taskCache: tc });
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Failed to load today's tasks";
          set({ error: errorMessage });
          throw new Error(errorMessage);
        } finally {
          set({ loading: false });
        }
      },

      loadUpcommingTasks: async (): Promise<void> => {
        try {
          set({ loading: true, error: null });
          const upcomingTasksList = await taskRepository.findUpcomingTasks();
          let tc = Object.fromEntries(
            upcomingTasksList.map((task) => [task.id, task]),
          );
          set({ upcommingTasks: upcomingTasksList, taskCache: tc });
        } catch (err) {
          const errorMessage =
            err instanceof Error
              ? err.message
              : "Failed to load upcoming tasks";
          set({ error: errorMessage });
          throw new Error(errorMessage);
        } finally {
          set({ loading: false });
        }
      },

      loadBrowsedTasks: async (reset: boolean = false): Promise<void> => {
        try {
          const currentOffset = get().offset;
          const currentBrowsedTasks = get().browsedTasks;

          // Reset offset and browsedTasks if this is a fresh load
          if (reset) {
            set({ offset: 0, browsedTasks: [] });
          }

          set({
            loading: reset ? true : false,
            loadingMore: !reset,
            error: null,
          });

          // Get current filter state
          const { statusFilter, dateRangeFilter, searchTextFilter } = get();

          // Build query based on filters
          let query: any = {};

          if (statusFilter && statusFilter !== "all") {
            query.status = statusFilter as TaskStatus;
          }

          if (
            dateRangeFilter &&
            dateRangeFilter.startDate &&
            dateRangeFilter.endDate
          ) {
            const startDate = dateRangeFilter.startDate.toDate();
            const endDate = dateRangeFilter.endDate.toDate();

            // Set end date to end of day
            endDate.setHours(23, 59, 59, 999);
            query.scheduledAtEpochMillis = {
              $gte: startDate.getTime(),
              $lte: endDate.getTime(),
            };
          }

          if (searchTextFilter && searchTextFilter.trim()) {
            query.searchText = searchTextFilter;
          }

          const offset = reset ? 0 : currentOffset;
          const browsedTasksList = await taskRepository.findBrowsedTasks(
            query,
            offset,
            10,
          );
          // Check if there are more tasks
          const hasMore = browsedTasksList.length === 10;

          // Update state
          const newBrowsedTasks = reset
            ? browsedTasksList
            : [...currentBrowsedTasks, ...browsedTasksList];
          const newOffset = offset + browsedTasksList.length;

          let tc = Object.fromEntries(
            newBrowsedTasks.map((task) => [task.id, task]),
          );

          set({
            browsedTasks: newBrowsedTasks,
            taskCache: tc,
            offset: newOffset,
            hasMore,
          });
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Failed to load browsed tasks";
          set({ error: errorMessage });
          throw new Error(errorMessage);
        } finally {
          set({ loading: false, loadingMore: false });
        }
      },
    }),
    {
      name: "task-store",
    },
  ),
);
