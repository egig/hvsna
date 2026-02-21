import { useCallback, useEffect, useState, useRef } from "react";
import { useTaskStore } from "./task-store";
import { useTask } from "./use-task";
import type { Task } from "./types";

export function useTasks() {
  const {
    browsedTasks,
    loading,
    loadingMore,
    error,
    hasMore,
    deleteTask,
    loadBrowsedTasks,
    statusFilter,
    dateRangeFilter,
    searchTextFilter,
    setStatusFilter,
    setDateRangeFilter,
    setSearchTextFilter,
    clearFilters,
  } = useTaskStore();
  const [initiated, setInitiated] = useState(false);
  const [isScrollable, setIsScrollable] = useState(false);
  const { openTaskForm, setEditingTaskId } = useTask();

  // Load browsed tasks on mount
  useEffect(() => {
    const loadData = async () => {
      setInitiated(true);
      loadBrowsedTasks(true); // Reset on initial load
    };
    loadData();
  }, []);

  const openEditPopup = useCallback((task: Task) => {
    openTaskForm(task.id);
  }, []);

  const handleTaskSuccess = useCallback(() => {
    loadBrowsedTasks(true); // Reset when task is updated
  }, []);

  const handleTaskError = useCallback((errorMessage: string) => {
    alert(errorMessage);
  }, []);

  const handleTaskCancel = useCallback(() => {
    openTaskForm();
  }, []);

  const handleDeleteTask = useCallback(
    async (task: Task) => {
      try {
        await deleteTask(task.id);
        loadBrowsedTasks(true); // Reset when task is deleted
        setEditingTaskId(null);
      } catch (err) {
        alert("Failed to delete task. Please try again.");
      }
    },
    [deleteTask, setEditingTaskId],
  );

  const handleDeleteTaskById = useCallback(
    async (taskId: string) => {
      const task = browsedTasks.find((t: Task) => t.id === taskId);
      if (task) {
        await handleDeleteTask(task);
      }
    },
    [browsedTasks, handleDeleteTask],
  );

  const handleInfiniteScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const element = e.currentTarget;
      const { scrollTop, scrollHeight, clientHeight } = element;

      // Check if content is scrollable
      const scrollable = scrollHeight > clientHeight;
      setIsScrollable(scrollable);

      // If content is not scrollable and we have more tasks, load them
      if (!scrollable && hasMore && !loading && !loadingMore) {
        loadBrowsedTasks(false);
        return;
      }

      // Check if user has scrolled within 200px of the bottom
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 200;

      if (!loading && !loadingMore && hasMore && isNearBottom) {
        loadBrowsedTasks(false); // Don't reset for pagination
      }
    },
    [loading, loadingMore, hasMore, loadBrowsedTasks, browsedTasks.length],
  );

  // Check scrollability when tasks change
  useEffect(() => {
    if (initiated && !loading && browsedTasks.length > 0) {
      // Trigger a scroll check after a short delay to let DOM update
      const timer = setTimeout(() => {
        const scrollElement = document.querySelector(".tasks-scroll-container");
        if (scrollElement) {
          const { scrollHeight, clientHeight } = scrollElement;
          const scrollable = scrollHeight > clientHeight;
          setIsScrollable(scrollable);

          // If not scrollable and has more tasks, load more
          if (!scrollable && hasMore && !loadingMore) {
            loadBrowsedTasks(false);
          }
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [browsedTasks.length, loading, initiated, hasMore, loadingMore]);

  // Also check scrollability after loading completes
  useEffect(() => {
    if (initiated && !loading && !loadingMore) {
      const timer = setTimeout(() => {
        const scrollElement = document.querySelector(".tasks-scroll-container");
        if (scrollElement) {
          const { scrollHeight, clientHeight } = scrollElement;
          const scrollable = scrollHeight > clientHeight;
          setIsScrollable(scrollable);

          // If not scrollable and has more tasks, load more
          if (!scrollable && hasMore) {
            loadBrowsedTasks(false);
          }
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [loading, loadingMore, initiated, hasMore]);

  return {
    // Data
    tasks: browsedTasks,
    loading,
    initiated,
    loadingMore,
    error,
    hasMore,
    isScrollable,

    // Filter state
    statusFilter,
    dateRangeFilter,
    searchTextFilter,

    // Handlers
    refreshTasks: () => loadBrowsedTasks(true),
    openEditPopup,
    handleTaskSuccess,
    handleTaskError,
    handleTaskCancel,
    handleDeleteTask,
    handleDeleteTaskById,
    handleInfiniteScroll,

    // Filter actions
    setStatusFilter,
    setDateRangeFilter,
    setSearchTextFilter,
    clearFilters,
  };
}
