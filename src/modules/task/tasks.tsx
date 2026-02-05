import { useEffect, useRef, useState } from "react";
import { useTasks } from "./use-tasks";
import { PlusIcon, Plus, Check } from "lucide-react";
import type { Task, TaskStatus } from "src/lib/types/task";
import { Navbar } from "../navigation/navbar";
import { Modal } from "../navigation/modal";
import TaskForm from "./task-form";
import { Page } from "../navigation";
import { LoadingSpinner } from "src/components/loader";
import TaskListItem from "src/components/task-list-item";

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
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  const openAddPopup = () => {
    // Reset form first, then open sheet
    // Use setTimeout to ensure state is set before opening sheet
    setEditingTaskId(null);
    setTimeout(() => setSheetOpened(true), 0);
  };

  const openEditPopup = (task: Task) => {
    setEditingTaskId(task.id);
    setSheetOpened(true);
  };

  const closePopup = () => {
    setSheetOpened(false);
  };

  const handleTaskSuccess = () => {
    setSheetOpened(false);
    refreshTasks();
  };

  const handleTaskError = (errorMessage: string) => {
    alert(errorMessage);
  };

  const handleTaskCancel = () => {
    setSheetOpened(false);
  };

  const handleDeleteTask = async (task: Task) => {
    try {
      await deleteTask(task.id);
      refreshTasks();
      setSheetOpened(false);
    } catch (err) {
      console.error("Failed to delete task:", err);
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
          <button
            onClick={openAddPopup}
            className="flex items-center justify-center w-10 h-10 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
            aria-label="Add task"
          >
            <Plus size={20} />
          </button>
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
            <button
              onClick={openAddPopup}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 mx-auto"
            >
              <PlusIcon size={16} />
              Create Task
            </button>
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

      <Modal isOpen={sheetOpened} onClose={closePopup}>
        <TaskForm
          taskId={editingTaskId}
          onSuccess={handleTaskSuccess}
          onError={handleTaskError}
          onCancel={handleTaskCancel}
          onDelete={handleDeleteTaskById}
        />
      </Modal>
    </Page>
  );
}
