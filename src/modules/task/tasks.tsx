import { useEffect, useRef, useState } from "react";
import { useTasks } from "./use-tasks";
import { PlusIcon, Plus, Check, Settings } from "lucide-react";
import type { Task, TaskStatus } from "src/lib/types/task";
import { Navbar } from "../navigation/navbar";
import { Modal } from "../navigation/modal";
import TaskForm from "./task-form";
import { Button, Page } from "../navigation";
import { LoadingSpinner } from "src/components/loader";
import TaskListItem from "src/components/task-list-item";
import { useTaskStore } from "./task-store";

export default function Tasks() {
  const {
    tasks,
    loading,
    loadingMore,
    error,
    hasMore,
    deleteTask,
    refreshTasks,
    loadMoreTasks,
    updateStatus,
  } = useTasks();
  const allowInfinite = useRef(true);
  const [sheetOpened, setSheetOpened] = useState(false);
  const { openTaskForm, setEditingTaskId } = useTaskStore();

  const openEditPopup = (task: Task) => {
    openTaskForm(task.id);
  };

  const handleTaskSuccess = () => {
    refreshTasks();
  };

  const handleTaskError = (errorMessage: string) => {
    alert(errorMessage);
  };

  const handleTaskCancel = () => {
    openTaskForm();
  };

  const handleDeleteTask = async (task: Task) => {
    try {
      await deleteTask(task.id);
      refreshTasks();
      setEditingTaskId(null);
    } catch (err) {
      alert("Failed to delete task. Please try again.");
    }
  };

  const handleDeleteTaskById = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      await handleDeleteTask(task);
    }
  };

  const handleStatusChange = async (task: Task, newStatus: TaskStatus) => {
    try {
      await updateStatus(task.id, newStatus);
      refreshTasks();
    } catch (err) {
      console.error("Failed to update task status:", err);
      alert("Failed to update task status. Please try again.");
    }
  };

  const handleInfiniteScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!allowInfinite.current) return;

    // Don't load more if already loading or no more data
    if (loadingMore || !hasMore) {
      allowInfinite.current = false;
      return;
    }

    const element = e.currentTarget;
    const { scrollTop, scrollHeight, clientHeight } = element;

    // Load more when user is within 100px of the bottom
    if (scrollHeight - scrollTop - clientHeight < 100) {
      allowInfinite.current = false;
      loadMoreTasks().finally(() => {
        allowInfinite.current = true;
      });
    }
  };

  return (
    <Page>
      <Navbar
        showBackButton={false}
        title="Tasks"
        rightAction={
          <Button to="/settings" aria-label="Settings">
            <Settings size={20} />
          </Button>
        }
      />

      <div
        className="h-[calc(100vh-160px)] overflow-y-auto"
        onScroll={handleInfiniteScroll}
      >
        {error && (
          <div className="text-center py-8">
            <div className="text-red-600 mb-4">Error: {error}</div>
            <button
              onClick={refreshTasks}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 mx-auto"
            >
              <Plus className="rotate-45" size={16} />
              Retry
            </button>
          </div>
        )}

        {!loading && !error && tasks.length === 0 && (
          <div className="text-center py-8">
            <Check className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              No tasks yet
            </p>
            <p className="text-gray-500 dark:text-gray-500 mb-4">
              Create your first task to get started!
            </p>
          </div>
        )}

        {!loading && !error && tasks.length > 0 && (
          <>
            {tasks.map((task) => (
              <TaskListItem
                key={task.id}
                task={task}
                onStatusChange={handleStatusChange}
                onEdit={openEditPopup}
              />
            ))}
          </>
        )}

        {!hasMore && tasks.length > 0 && (
          <div className="text-center py-4">
            <p className="text-gray-500 dark:text-gray-500">
              No more tasks to load
            </p>
          </div>
        )}

        {loadingMore && hasMore && (
          <div className="flex justify-center py-4">
            <LoadingSpinner size="md" />
          </div>
        )}
      </div>
    </Page>
  );
}
