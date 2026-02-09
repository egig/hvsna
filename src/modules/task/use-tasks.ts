import { useCallback, useEffect, useState, useRef } from "react";
import { useTaskStore } from "./task-store";
import { useTask } from "./use-task";
import type { Task } from "src/lib/types/task";

export function useTasks() {
  const {
    browsedTasks,
    loading,
    error,
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
  const { openTaskForm, setEditingTaskId } = useTask();

  // Load browsed tasks on mount
  useEffect(() => {
    const loadData = async () => {
      setInitiated(true);
      loadBrowsedTasks();
    };
    loadData();
  }, []);

  const openEditPopup = useCallback((task: Task) => {
    openTaskForm(task.id);
  }, []);

  const handleTaskSuccess = useCallback(() => {
    loadBrowsedTasks();
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
        loadBrowsedTasks();
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

  return {
    // Data
    tasks: browsedTasks,
    loading,
    initiated,
    loadingMore: false,
    error,
    hasMore: false,

    // Filter state
    statusFilter,
    dateRangeFilter,
    searchTextFilter,

    // Handlers
    refreshTasks: () => loadBrowsedTasks(),
    openEditPopup,
    handleTaskSuccess,
    handleTaskError,
    handleTaskCancel,
    handleDeleteTask,
    handleDeleteTaskById,
    handleInfiniteScroll: () => {}, // No-op since browsedTasks doesn't support pagination

    // Filter actions
    setStatusFilter,
    setDateRangeFilter,
    setSearchTextFilter,
    clearFilters,
  };
}
