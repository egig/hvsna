import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTaskRepository } from "./use-task-repository";
import { queryKeys } from "../query-keys";
import type { Task, TaskQuery, TaskTypeFilter } from "@/domain/task";
import { useTaskContext } from "./task-context";
import log from "../logger";

export function useTasks() {
  const [initiated, setInitiated] = useState(false);
  const [isScrollable, setIsScrollable] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const { openEditTaskForm, setEditingTaskId } = useTaskContext();
  const taskRepo = useTaskRepository();

  // Local filter state
  const [dateRangeFilter, setDateRangeFilter] = useState<{
    startDate: number;
    endDate: number;
  } | null>(null);
  const [searchTextFilter, setSearchTextFilter] = useState<string>("");
  const [unscheduledFilter, setUnscheduledFilter] = useState<boolean>(false);
  const [taskTypeFilter, setTaskTypeFilter] = useState<TaskTypeFilter>("all");
  const [tagFilter, setTagFilter] = useState<string[]>([]);

  const clearFilters = useCallback(() => {
    setDateRangeFilter(null);
    setSearchTextFilter("");
    setUnscheduledFilter(false);
    setTaskTypeFilter("all");
    setTagFilter([]);
  }, []);

  // Create filter key for React Query
  const filterKey = [
    dateRangeFilter
      ? `${dateRangeFilter.startDate}-${dateRangeFilter.endDate}`
      : "",
    searchTextFilter || "",
    unscheduledFilter ? "1" : "",
    taskTypeFilter === "all" ? "" : taskTypeFilter,
    tagFilter.join(","),
  ].join("|");

  // Build query object for repository
  const buildQuery = (): TaskQuery => {
    const query: TaskQuery = { status: 0 as const };

    if (searchTextFilter && searchTextFilter.trim()) {
      query.searchText = searchTextFilter;
    }

    // Add date range filter
    if (dateRangeFilter) {
      query.atEpochMillis = {
        $gte: dateRangeFilter.startDate,
        $lte: dateRangeFilter.endDate,
      };
    }

    // Add unscheduled filter
    if (unscheduledFilter) {
      query.unscheduled = 1;
    }

    // Add task type filter
    if (taskTypeFilter !== "all") {
      query.taskType = taskTypeFilter;
    }

    // Add tag filter (OR logic — matching any selected tag)
    if (tagFilter.length > 0) {
      query.tags = tagFilter;
    }

    return query;
  };

  // React Query for browsed tasks
  const browsedTasksQuery = useQuery({
    queryKey: queryKeys.browsedTasks(filterKey),
    queryFn: () => taskRepo.findBrowsedTasks(buildQuery()), // Load initial page
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Load more tasks (pagination)
  const loadMoreTasks = useCallback(async () => {
    if (!hasMore || browsedTasksQuery.isFetching || browsedTasksQuery.isPending)
      return;

    try {
      const newTasks = await taskRepo.findBrowsedTasks(buildQuery());

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
    ]
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
    dateRangeFilter,
    searchTextFilter,
    unscheduledFilter,
    taskTypeFilter,
    tagFilter,

    // Handlers
    refreshTasks: resetPagination,
    openEditPopup,
    handleTaskSuccess,
    handleTaskError,
    handleInfiniteScroll,

    // Filter actions
    setDateRangeFilter,
    setSearchTextFilter,
    setUnscheduledFilter,
    setTaskTypeFilter,
    setTagFilter,
    clearFilters,
  };
}
