import { useState } from "react";
import { Plus, Check, Filter, FilterX } from "lucide-react";
import { Navbar } from "../navigation/navbar";
import { Modal } from "../navigation/modal";
import TaskFilterModal from "./task-filter-modal";
import { Button, Page } from "../navigation";
import { LoadingSpinner } from "src/components/loader";
import TaskListItem from "src/components/task-list-item";
import { useTasks } from "./use-tasks";
import { useLanguageContext } from "../common/LanguageContext";

export default function Tasks() {
  const { t } = useLanguageContext();
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
    handleInfiniteScroll,
    statusFilter,
    dateRangeFilter,
    searchTextFilter,
    setStatusFilter,
    setDateRangeFilter,
    setSearchTextFilter,
    clearFilters,
  } = useTasks();

  const handleFilterModalClose = () => {
    setFilterModalOpened(false);
  };

  const hasFilter = () => {
    return (
      searchTextFilter !== "" || statusFilter !== "all" || !!dateRangeFilter
    );
  };

  return (
    <Page>
      <Navbar
        showBackButton={false}
        title={t("tasks")}
        rightAction={
          <Button
            onClick={() => setFilterModalOpened(true)}
            aria-label={t("filter_options")}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-500"
          >
            {hasFilter() && (
              <div className="absolute w-2 h-2 bg-[var(--hvsna-primary-color)] opacity-[0.8] rounded-full" />
            )}
            <Filter size={20} />
          </Button>
        }
      />

      <div
        className="h-[calc(100vh-var(--tab-bar-height)-60px)] overflow-y-auto"
        onScroll={handleInfiniteScroll}
      >
        {initiated && error && (
          <div className="text-center py-8">
            <div className="text-red-600 mb-4">
              {t("error_colon", { error })}
            </div>
            <button
              onClick={refreshTasks}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 mx-auto"
            >
              <Plus className="rotate-45" size={16} />
              {t("retry")}
            </button>
          </div>
        )}

        {initiated && !loading && !error && tasks.length === 0 && (
          <div className="text-center py-8">
            <Check className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              {t("no_tasks_yet")}
            </p>
            <p className="text-gray-500 dark:text-gray-500 mb-4">
              {t("create_first_task_to_get_started")}
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
              {t("no_more_tasks_to_load")}
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
        title={t("filter_tasks")}
      >
        <TaskFilterModal
          isOpen={filterModalOpened}
          onClose={handleFilterModalClose}
          statusFilter={statusFilter}
          dateRangeFilter={dateRangeFilter}
          searchTextFilter={searchTextFilter}
          onStatusFilterChange={setStatusFilter}
          onDateRangeFilterChange={setDateRangeFilter}
          onSearchTextFilterChange={setSearchTextFilter}
          onClear={clearFilters}
        />
      </Modal>
    </Page>
  );
}
