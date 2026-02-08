import { useCallback, useEffect, useState } from "react";
import { useTaskStore } from "./task-store";
import { useTask } from "./use-task";
import type { Task } from "src/lib/types/task";

export function useTasksState(filters?: {
  status?: string;
  dateRange?: string;
}) {
  const { browsedTasks, loading, error, deleteTask, loadBrowsedTasks } =
    useTaskStore();
  const [initiated, setInitiated] = useState(false);
  const { openTaskForm, setEditingTaskId } = useTask();

  // Load browsed tasks on mount and when filters change
  useEffect(() => {
    const loadData = async () => {
      setInitiated(true);
      loadBrowsedTasks(filters);
    };
    loadData();
  }, [loadBrowsedTasks]);

  const openEditPopup = useCallback(
    (task: Task) => {
      openTaskForm(task.id);
    },
    [openTaskForm],
  );

  const handleTaskSuccess = useCallback(() => {
    loadBrowsedTasks(filters);
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
        loadBrowsedTasks(filters);
        setEditingTaskId(null);
      } catch (err) {
        alert("Failed to delete task. Please try again.");
      }
    },
    [deleteTask, loadBrowsedTasks, setEditingTaskId],
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

    // Handlers
    refreshTasks: () => loadBrowsedTasks(filters),
    openEditPopup,
    handleTaskSuccess,
    handleTaskError,
    handleTaskCancel,
    handleDeleteTask,
    handleDeleteTaskById,
    handleInfiniteScroll: () => {}, // No-op since browsedTasks doesn't support pagination
  };
}
