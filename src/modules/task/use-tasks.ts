import { useCallback, useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { taskRepository } from "./task-repository";
import { queryKeys } from "../common/query-keys";
import type { Task, TaskStatus, TaskQuery } from "./types";
import { HijriDate } from "../calendar/hijri";
import { useTaskContext } from "./task-context";

export function useTasks() {
  const [initiated, setInitiated] = useState(false);
  const [isScrollable, setIsScrollable] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const { openTaskForm, setEditingTaskId } = useTaskContext();

  // Local filter state
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [dateRangeFilter, setDateRangeFilter] = useState<{
    startDate: HijriDate;
    endDate: HijriDate;
  } | null>(null);
  const [searchTextFilter, setSearchTextFilter] = useState<string>("");

  const clearFilters = useCallback(() => {
    setStatusFilter("all");
    setDateRangeFilter(null);
    setSearchTextFilter("");
  }, []);

  // Create filter key for React Query
  const createFilterKey = () => {
    const filterParts = [
      statusFilter === "all" ? "" : statusFilter.toString(),
      dateRangeFilter
        ? `${dateRangeFilter.startDate.toString()}-${dateRangeFilter.endDate.toString()}`
        : "",
      searchTextFilter || "",
    ];
    return filterParts.join("|");
  };

  const filterKey = createFilterKey();

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

    return query;
  };

  // React Query for browsed tasks
  const browsedTasksQuery = useQuery({
    queryKey: queryKeys.browsedTasks(filterKey),
    queryFn: () => taskRepository.findBrowsedTasks(buildQuery(), 0, 50), // Load initial page
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Load more tasks (pagination)
  const loadMoreTasks = useCallback(async () => {
    if (!hasMore || browsedTasksQuery.isFetching || browsedTasksQuery.isPending)
      return;

    try {
      const newTasks = await taskRepository.findBrowsedTasks(
        buildQuery(),
        offset,
        10,
      );

      // Update hasMore based on whether we got a full page
      setHasMore(newTasks.length >= 10);

      // Update offset for next page
      setOffset((prev) => prev + newTasks.length);

      // Invalidate query to trigger refetch with new data
      browsedTasksQuery.refetch();
    } catch (error) {
      console.error("Failed to load more tasks:", error);
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
    openTaskForm(task.id);
  }, []);

  const handleTaskSuccess = useCallback(() => {
    resetPagination();
  }, [resetPagination]);

  const handleTaskError = useCallback((errorMessage: string) => {
    alert(errorMessage);
  }, []);

  const handleTaskCancel = useCallback(() => {
    openTaskForm();
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

    // Handlers
    refreshTasks: resetPagination,
    openEditPopup,
    handleTaskSuccess,
    handleTaskError,
    handleTaskCancel,
    handleInfiniteScroll,

    // Filter actions
    setStatusFilter,
    setDateRangeFilter,
    setSearchTextFilter,
    clearFilters,
  };
}
