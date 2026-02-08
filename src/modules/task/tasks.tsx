import { useState } from "react";
import { PlusIcon, Plus, Check, Settings, MoreVertical } from "lucide-react";
import { Navbar } from "../navigation/navbar";
import { Modal } from "../navigation/modal";
import TaskForm from "./task-form";
import TaskFilterModal from "./task-filter-modal";
import { Button, Page } from "../navigation";
import { LoadingSpinner } from "src/components/loader";
import TaskListItem from "src/components/task-list-item";
import { useTasksState } from "./use-tasks-state";

export default function Tasks() {
  const [sheetOpened, setSheetOpened] = useState(false);
  const [filterModalOpened, setFilterModalOpened] = useState(false);

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
    statusFilter,
    dateRangeFilter,
    setStatusFilter,
    setDateRangeFilter,
    clearFilters,
  } = useTasksState();

  const handleFilterModalClose = () => {
    setFilterModalOpened(false);
  };

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
      <Modal
        isOpen={filterModalOpened}
        onClose={handleFilterModalClose}
        title="Filter Tasks"
      >
        <TaskFilterModal
          isOpen={filterModalOpened}
          onClose={handleFilterModalClose}
          statusFilter={statusFilter}
          dateRangeFilter={dateRangeFilter}
          onStatusFilterChange={setStatusFilter}
          onDateRangeFilterChange={setDateRangeFilter}
          onClear={clearFilters}
        />
      </Modal>
    </Page>
  );
}
