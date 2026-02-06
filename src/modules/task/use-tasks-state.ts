import { useCallback, useEffect } from "react";
import { useTaskStore } from "./task-store";
import { useTask } from "./use-task";
import type { Task } from "src/lib/types/task";

export function useTasksState() {
  const { browsedTasks, loading, error, deleteTask, loadBrowsedTasks } =
    useTaskStore();
  const { openTaskForm, setEditingTaskId } = useTask();

  // Load browsed tasks on mount
  useEffect(() => {
    loadBrowsedTasks();
  }, [loadBrowsedTasks]);

  const openEditPopup = useCallback(
    (task: Task) => {
      openTaskForm(task.id);
    },
    [openTaskForm],
  );

  const handleTaskSuccess = useCallback(() => {
    loadBrowsedTasks();
  }, [loadBrowsedTasks]);

  const handleTaskError = useCallback((errorMessage: string) => {
    alert(errorMessage);
  }, []);

  const handleTaskCancel = useCallback(() => {
    openTaskForm();
  }, [openTaskForm]);

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
    loadingMore: false,
    error,
    hasMore: false,

    // Handlers
    refreshTasks: loadBrowsedTasks,
    openEditPopup,
    handleTaskSuccess,
    handleTaskError,
    handleTaskCancel,
    handleDeleteTask,
    handleDeleteTaskById,
    handleInfiniteScroll: () => {}, // No-op since browsedTasks doesn't support pagination
  };
}
