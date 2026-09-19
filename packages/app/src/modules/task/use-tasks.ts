import { useCallback, useEffect, useMemo, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useTaskRepository } from "./use-task-repository";
import { queryKeys } from "../query-keys";
import type { Task, TaskQuery, TaskTypeFilter } from "@/domain/task";
import { useTaskFormContext } from "./task-form-context";
import log from "../logger";

export function useTasks() {
  const PAGE_SIZE = 50;
  const [initiated, setInitiated] = useState(false);
  const [isScrollable, setIsScrollable] = useState(false);

  const { openEditTaskForm } = useTaskFormContext();
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
  const buildQuery = useCallback((): TaskQuery => {
    const query: TaskQuery = { status: 0 as const };

    if (searchTextFilter && searchTextFilter.trim()) {
      query.searchText = searchTextFilter;
    }

    // Add date range filter
    if (dateRangeFilter) {
      query.atEpochMillis = {
        from: dateRangeFilter.startDate,
        to: dateRangeFilter.endDate,
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
  }, [dateRangeFilter, searchTextFilter, tagFilter, taskTypeFilter, unscheduledFilter]);

  // React Query owns the page cursor so each request fetches a distinct slice.
  const browsedTasksQuery = useInfiniteQuery({
    queryKey: queryKeys.browsedTasks(filterKey),
    queryFn: ({ pageParam }) =>
      taskRepo.findBrowsedTasks(buildQuery(), pageParam, PAGE_SIZE),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === PAGE_SIZE ? allPages.length * PAGE_SIZE : undefined,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  const tasks = useMemo(
    () => browsedTasksQuery.data?.pages.flat() ?? [],
    [browsedTasksQuery.data],
  );
  const hasMore =
    browsedTasksQuery.hasNextPage ?? browsedTasksQuery.isPending;

  // Load more tasks (pagination)
  const loadMoreTasks = useCallback(async () => {
    if (
      !hasMore ||
      browsedTasksQuery.isFetchingNextPage ||
      browsedTasksQuery.isPending
    )
      return;

    try {
      await browsedTasksQuery.fetchNextPage();
    } catch (error) {
      log.error("Failed to load more tasks:", error);
    }
  }, [
    hasMore,
    browsedTasksQuery.isFetchingNextPage,
    browsedTasksQuery.isPending,
    browsedTasksQuery.fetchNextPage,
  ]);

  // React Query resets the page stack when filterKey changes.
  const resetPagination = useCallback(() => {
    browsedTasksQuery.refetch();
  }, [browsedTasksQuery]);

  // Initialize on mount
  useEffect(() => {
    setInitiated(true);
  }, []);

  const openEditPopup = useCallback((task: Task) => {
    openEditTaskForm(task.id as string);
  }, [openEditTaskForm]);

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
      tasks.length > 0
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
    tasks,
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
    tasks,
    loading: browsedTasksQuery.isPending,
    initiated,
    loadingMore: browsedTasksQuery.isFetchingNextPage,
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
