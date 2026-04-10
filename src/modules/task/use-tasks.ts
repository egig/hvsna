import { useCallback, useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePouchDB } from "../../pouchdb";
import { createTaskUseCases } from "../../usecases/task";
import { queryKeys } from "../query-keys";
import type { Task, TaskStatus, TaskQuery, TaskTypeFilter } from "./types";
import { HijriDate } from "../calendar/hijri";
import { useTaskContext } from "./task-context";
import log from "../logger";

export function useTasks() {
  const [initiated, setInitiated] = useState(false);
  const [isScrollable, setIsScrollable] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const { openEditTaskForm, setEditingTaskId } = useTaskContext();
  const { db } = usePouchDB();
  const taskUseCases = createTaskUseCases(db);

  // Local filter state
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [dateRangeFilter, setDateRangeFilter] = useState<{
    startDate: HijriDate;
    endDate: HijriDate;
  } | null>(null);
  const [searchTextFilter, setSearchTextFilter] = useState<string>("");
  const [unscheduledFilter, setUnscheduledFilter] = useState<boolean>(false);
  const [listIdFilter, setListIdFilter] = useState<string | null>(null);
  const [taskTypeFilter, setTaskTypeFilter] = useState<TaskTypeFilter>("all");

  const clearFilters = useCallback(() => {
    setStatusFilter("all");
    setDateRangeFilter(null);
    setSearchTextFilter("");
    setUnscheduledFilter(false);
    setListIdFilter(null);
    setTaskTypeFilter("all");
  }, []);

  // Create filter key for React Query
  const filterKey = [
    statusFilter === "all" ? "" : statusFilter.toString(),
    dateRangeFilter
      ? `${dateRangeFilter.startDate.toString()}-${dateRangeFilter.endDate.toString()}`
      : "",
    searchTextFilter || "",
    unscheduledFilter ? "1" : "",
    listIdFilter || "",
    taskTypeFilter === "all" ? "" : taskTypeFilter,
  ].join("|");

  // Build query object for repository
  const buildQuery = (): TaskQuery => {
    const query: TaskQuery = {};

    if (statusFilter !== undefined && statusFilter !== "all") {
      query.status = statusFilter as TaskStatus;
    }

    if (searchTextFilter && searchTextFilter.trim()) {
      query.searchText = searchTextFilter;
    }

    // Add date range filter
    if (dateRangeFilter) {
      const startEpoch = dateRangeFilter.startDate.toDate().valueOf();
      const endEpoch = dateRangeFilter.endDate.toDate().valueOf();
      query.atEpochMillis = {
        $gte: startEpoch,
        $lte: endEpoch,
      };
    }

    // Add unscheduled filter
    if (unscheduledFilter) {
      query.unscheduled = 1;
    }

    // Add list filter
    if (listIdFilter) {
      query.listId = listIdFilter;
    }

    // Add task type filter
    if (taskTypeFilter !== "all") {
      query.taskType = taskTypeFilter;
    }

    return query;
  };

  // React Query for browsed tasks
  const browsedTasksQuery = useQuery({
    queryKey: queryKeys.browsedTasks(filterKey),
    queryFn: () => taskUseCases.getTasks(buildQuery()), // Load initial page
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Load more tasks (pagination)
  const loadMoreTasks = useCallback(async () => {
    if (!hasMore || browsedTasksQuery.isFetching || browsedTasksQuery.isPending)
      return;

    try {
      const newTasks = await taskUseCases.getTasks(buildQuery());

      // Update hasMore based on whether we got a full page
      setHasMore(newTasks.length >= 10);

      // Update offset for next page
      setOffset((prev) => prev + newTasks.length);

      // Invalidate query to trigger refetch with new data
      browsedTasksQuery.refetch();
    } catch (error) {
      log.error("Failed to load more tasks:", error);
    }
  }, [
    hasMore,
    browsedTasksQuery.isFetching,
    browsedTasksQuery.isPending,
    offset,
    buildQuery,
  ]);

  // Reset pagination when filters change
  const resetPagination = useCallback(() => {
    setOffset(0);
    setHasMore(true);
    browsedTasksQuery.refetch();
  }, [browsedTasksQuery]);

  // Initialize on mount
  useEffect(() => {
    setInitiated(true);
  }, []);

  const openEditPopup = useCallback((task: Task) => {
    openEditTaskForm(task.id as string);
  }, []);

  const handleTaskSuccess = useCallback(() => {
    resetPagination();
  }, [resetPagination]);

  const handleTaskError = useCallback((errorMessage: string) => {
    alert(errorMessage);
  }, []);

  const handleInfiniteScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const element = e.currentTarget;
      const { scrollTop, scrollHeight, clientHeight } = element;

      // Check if content is scrollable
      const scrollable = scrollHeight > clientHeight;
      setIsScrollable(scrollable);

      // If content is not scrollable and we have more tasks, load them
      if (
        !scrollable &&
        hasMore &&
        !browsedTasksQuery.isPending &&
        !browsedTasksQuery.isFetching
      ) {
        loadMoreTasks();
        return;
      }

      // Check if user has scrolled within 200px of the bottom
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 200;

      if (
        !browsedTasksQuery.isPending &&
        !browsedTasksQuery.isFetching &&
        hasMore &&
        isNearBottom
      ) {
        loadMoreTasks();
      }
    },
    [
      browsedTasksQuery.isPending,
      browsedTasksQuery.isFetching,
      hasMore,
      loadMoreTasks,
    ],
  );

  // Check scrollability when tasks change
  useEffect(() => {
    if (
      initiated &&
      !browsedTasksQuery.isPending &&
      browsedTasksQuery.data &&
      browsedTasksQuery.data.length > 0
    ) {
      // Trigger a scroll check after a short delay to let DOM update
      const timer = setTimeout(() => {
        const scrollElement = document.querySelector(".tasks-scroll-container");
        if (scrollElement) {
          const { scrollHeight, clientHeight } = scrollElement;
          const scrollable = scrollHeight > clientHeight;
          setIsScrollable(scrollable);

          // If not scrollable and has more tasks, load more
          if (!scrollable && hasMore && !browsedTasksQuery.isFetching) {
            loadMoreTasks();
          }
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [
    initiated,
    browsedTasksQuery.isPending,
    browsedTasksQuery.data,
    hasMore,
    browsedTasksQuery.isFetching,
    loadMoreTasks,
  ]);

  // Also check scrollability after loading completes
  useEffect(() => {
    if (
      initiated &&
      !browsedTasksQuery.isPending &&
      !browsedTasksQuery.isFetching
    ) {
      const timer = setTimeout(() => {
        const scrollElement = document.querySelector(".tasks-scroll-container");
        if (scrollElement) {
          const { scrollHeight, clientHeight } = scrollElement;
          const scrollable = scrollHeight > clientHeight;
          setIsScrollable(scrollable);

          // If not scrollable and has more tasks, load more
          if (!scrollable && hasMore) {
            loadMoreTasks();
          }
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [
    initiated,
    browsedTasksQuery.isPending,
    browsedTasksQuery.isFetching,
    hasMore,
    loadMoreTasks,
  ]);

  return {
    // Data
    tasks: browsedTasksQuery.data || [],
    loading: browsedTasksQuery.isPending,
    initiated,
    loadingMore: browsedTasksQuery.isFetching,
    error: browsedTasksQuery.error
      ? browsedTasksQuery.error instanceof Error
        ? browsedTasksQuery.error.message
        : "Unknown error"
      : null,
    hasMore,
    isScrollable,

    // Filter state
    statusFilter,
    dateRangeFilter,
    searchTextFilter,
    unscheduledFilter,
    listIdFilter,
    taskTypeFilter,

    // Handlers
    refreshTasks: resetPagination,
    openEditPopup,
    handleTaskSuccess,
    handleTaskError,
    handleInfiniteScroll,

    // Filter actions
    setStatusFilter,
    setDateRangeFilter,
    setSearchTextFilter,
    setUnscheduledFilter,
    setListIdFilter,
    setTaskTypeFilter,
    clearFilters,
  };
}
