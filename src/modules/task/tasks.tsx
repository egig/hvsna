import { useState } from "react";
import { PlusIcon, Plus, Check, Settings, MoreVertical } from "lucide-react";
import { Navbar } from "../navigation/navbar";
import { Modal } from "../navigation/modal";
import TaskForm from "./task-form";
import { Button, Page } from "../navigation";
import { LoadingSpinner } from "src/components/loader";
import TaskListItem from "src/components/task-list-item";
import { useTasksState } from "./use-tasks-state";

export default function Tasks() {
  const [sheetOpened, setSheetOpened] = useState(false);
  const [filterModalOpened, setFilterModalOpened] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateRangeFilter, setDateRangeFilter] = useState<string>("all");

  const {
    tasks,
    loading,
    initiated,
    loadingMore,
    error,
    hasMore,
    refreshTasks,
    openEditPopup,
    handleTaskSuccess,
    handleTaskError,
    handleTaskCancel,
    handleDeleteTask,
    handleDeleteTaskById,
    handleInfiniteScroll,
  } = useTasksState({
    status: statusFilter,
    dateRange: dateRangeFilter,
  });

  return (
    <Page>
      <Navbar
        showBackButton={false}
        title="Tasks"
        rightAction={
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setFilterModalOpened(true)}
              aria-label="Filter options"
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <MoreVertical size={20} />
            </Button>
            <Button to="/settings" aria-label="Settings">
              <Settings size={20} />
            </Button>
          </div>
        }
      />

      <div
        className="h-[calc(100vh-160px)] overflow-y-auto"
        onScroll={handleInfiniteScroll}
      >
        {initiated && error && (
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

        {initiated && !loading && !error && tasks.length === 0 && (
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

        {initiated && !loading && !error && tasks.length > 0 && (
          <>
            {tasks.map((task) => (
              <TaskListItem
                key={task.id}
                task={task}
                onEdit={openEditPopup}
                showDateTime={true}
              />
            ))}
          </>
        )}

        {initiated && !loading && !error && !hasMore && tasks.length > 0 && (
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

      {/* Filter Modal */}
      {filterModalOpened && (
        <Modal
          isOpen={filterModalOpened}
          onClose={() => setFilterModalOpened(false)}
          title="Filter Tasks"
        >
          <div className="space-y-6">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <div className="space-y-2">
                {[
                  { value: "all", label: "All Tasks" },
                  { value: "pending", label: "Pending" },
                  { value: "in_progress", label: "In Progress" },
                  { value: "completed", label: "Completed" },
                ].map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center space-x-3 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="status"
                      value={option.value}
                      checked={statusFilter === option.value}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date Range
              </label>
              <div className="space-y-2">
                {[
                  { value: "all", label: "All Time" },
                  { value: "today", label: "Today" },
                  { value: "week", label: "This Week" },
                  { value: "month", label: "This Month" },
                ].map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center space-x-3 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="dateRange"
                      value={option.value}
                      checked={dateRangeFilter === option.value}
                      onChange={(e) => setDateRangeFilter(e.target.value)}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                onClick={() => {
                  setStatusFilter("all");
                  setDateRangeFilter("all");
                  // Apply filters by triggering a refresh
                  setTimeout(() => setFilterModalOpened(false), 100);
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                Clear
              </Button>
              <Button
                onClick={() => setFilterModalOpened(false)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Apply
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </Page>
  );
}
