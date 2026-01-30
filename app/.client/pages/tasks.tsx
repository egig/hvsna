import { useEffect, useRef, useState } from "react";
import { useTasks } from "../hooks/use-tasks";
import { CheckCircleIcon, CircleIcon, Trash2Icon, PlusIcon, Plus, Check, MoreHorizontal } from "lucide-react";
import type { Task, TaskStatus } from "~/lib/types/task";
import TaskForm from "../components/task-form";
import { Page } from "../navigation/components/Page";
import { Navbar } from "../navigation/components/Navbar";
import { Modal } from "../navigation/components/Modal";
import { LoadingSpinner } from "../components/Loading";
import Block from "../components/block";

interface TaskItemProps {
  task: Task;
  onStatusChange: (task: Task, newStatus: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  getStatusIcon: (status: TaskStatus) => React.ReactNode;
  getStatusColor: (status: TaskStatus) => string;
  formatScheduledDate: (dateNumber?: number) => string;
}

function TaskItem({ task, onStatusChange, onEdit, onDelete, getStatusIcon, getStatusColor, formatScheduledDate }: TaskItemProps) {
  const [showActions, setShowActions] = useState(false);

  useEffect(() => {
    const handleClickOutside = () => setShowActions(false);
    if (showActions) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showActions]);

  const handleStatusClick = () => {
    const nextStatus = task.status === 'pending' ? 'in_progress' : 
                      task.status === 'in_progress' ? 'completed' : 'pending';
    onStatusChange(task, nextStatus);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-start gap-3">
        {/* Status Icon */}
        <button
          onClick={handleStatusClick}
          className="flex-shrink-0 mt-1 transition-transform hover:scale-110"
        >
          {getStatusIcon(task.status)}
        </button>
        
        {/* Task Content */}
        <div className="flex-1 min-w-0">
          <h3 
            className="font-medium text-gray-900 dark:text-white truncate cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
            onClick={() => onEdit(task)}
          >
            {task.name}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Scheduled: {formatScheduledDate(task.scheduledAt)}
          </p>
        </div>
        
        {/* Status Badge and Actions */}
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium px-2 py-1 rounded-full ${getStatusColor(task.status)} bg-opacity-10`}>
            {task.status.replace('_', ' ')}
          </span>
          
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowActions(!showActions);
              }}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <MoreHorizontal size={16} className="text-gray-500" />
            </button>
            
            {showActions && (
              <div className="absolute right-0 top-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10 min-w-[120px]">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(task);
                    setShowActions(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(task);
                    setShowActions(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Tasks() {
  const { tasks, loading, loadingMore, error, hasMore, deleteTask, refreshTasks, loadMoreTasks, updateTask } = useTasks();
  const allowInfinite = useRef(true);
  const [sheetOpened, setSheetOpened] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  const resetForm = () => {
    setEditingTaskId(null);
  };

  const openAddPopup = () => {
    // Reset form first, then open sheet
    setEditingTaskId(null);
    // Use setTimeout to ensure state is set before opening sheet
    setTimeout(() => setSheetOpened(true), 0);
  };

  const openEditPopup = (task: Task) => {
    setEditingTaskId(task.id);
    setSheetOpened(true);
  };

  const closePopup = () => {
    setSheetOpened(false);
  };

  // Reset form when sheet is closed
  useEffect(() => {
    if (!sheetOpened) {
      resetForm();
    }
  }, [sheetOpened]);

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
    if (confirm(`Are you sure you want to delete "${task.name}"?`)) {
      try {
        await deleteTask(task.id);
      } catch (err) {
        console.error('Failed to delete task:', err);
        alert('Failed to delete task. Please try again.');
      }
    }
  };

  const handleStatusChange = async (task: Task, newStatus: TaskStatus) => {
    try {
      await updateTask(task.id, { status: newStatus });
      refreshTasks();
    } catch (err) {
      console.error('Failed to update task status:', err);
      alert('Failed to update task status. Please try again.');
    }
  };

  const formatScheduledDate = (dateNumber?: number) => {
    if (!dateNumber) return 'No date set';
    return new Date(dateNumber).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon size={24} className="text-green-500" />;
      case 'in_progress':
        return <CircleIcon size={24} className="text-blue-500" />;
      default:
        return <CircleIcon size={24} className="text-gray-400" />;
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'in_progress':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
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
      
      <div className="p-4 h-[calc(100vh-80px)] overflow-y-auto" onScroll={handleInfiniteScroll}>
        {loading && (
          <div className="flex flex-col items-center justify-center py-8">
            <LoadingSpinner size="lg" text="Loading tasks..." />
          </div>
        )}

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
            <p className="text-gray-600 dark:text-gray-400 mb-2">No tasks yet</p>
            <p className="text-gray-500 dark:text-gray-500 mb-4">Create your first task to get started!</p>
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
          <div className="space-y-2">
            {tasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onStatusChange={handleStatusChange}
                onEdit={openEditPopup}
                onDelete={handleDeleteTask}
                getStatusIcon={getStatusIcon}
                getStatusColor={getStatusColor}
                formatScheduledDate={formatScheduledDate}
              />
            ))}
          </div>
        )}
        
        {!hasMore && tasks.length > 0 && (
          <div className="text-center py-4">
            <p className="text-gray-500 dark:text-gray-500">No more tasks to load</p>
          </div>
        )}
        
        {loadingMore && hasMore && (
          <div className="flex justify-center py-4">
            <LoadingSpinner size="md" />
          </div>
        )}
      </div>

      <Modal 
        isOpen={sheetOpened} 
        onClose={closePopup}
      >
        <TaskForm
          taskId={editingTaskId}
          onSuccess={handleTaskSuccess}
          onError={handleTaskError}
          onCancel={handleTaskCancel}
        />
      </Modal>
    </div>
  );
}
