import { useState } from "react";
import { HvPlus, HvCheck, HvFilter, HvFilterX } from "@/modules/icons";
import { Navbar } from "../navigation/navbar";
import { Modal } from "../navigation/modal";
import { EmptyState } from "../components/empty-state";
import TaskFilterModal from "./task-filter-modal";
import { Button, Page } from "../navigation";
import TaskListItem from "src/modules/task/task-list-item";
import { useTasks } from "./use-tasks";
import { useLanguageContext } from "../i18n/LanguageContext";

export default function Search() {
  const { t } = useLanguageContext();
  const [filterModalOpened, setFilterModalOpened] = useState(false);

  const {
    tasks,
    loading,
    initiated,
    error,
    hasMore,
    refreshTasks,
    openEditPopup,
    handleInfiniteScroll,
    statusFilter,
    dateRangeFilter,
    searchTextFilter,
    unscheduledFilter,
    taskTypeFilter,
    tagFilter,
    setStatusFilter,
    setDateRangeFilter,
    setSearchTextFilter,
    setUnscheduledFilter,
    setTaskTypeFilter,
    setTagFilter,
    clearFilters,
  } = useTasks();

  const handleFilterModalClose = () => {
    setFilterModalOpened(false);
  };

  const hasFilter = () => {
    return (
      searchTextFilter !== "" ||
      statusFilter !== "all" ||
      !!dateRangeFilter ||
      unscheduledFilter ||
      taskTypeFilter !== "all" ||
      tagFilter.length > 0
    );
  };

  return (
    <Page
      navbar={
        <Navbar
          showSearch={true}
          searchValue={searchTextFilter}
          onSearchChange={setSearchTextFilter}
          searchPlaceholder={t("search_tasks")}
          rightAction={
            <Button
              onClick={() => setFilterModalOpened(true)}
              aria-label={t("filter_options")}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-500"
            >
              {hasFilter() && (
                <div className="absolute w-2 h-2 bg-[var(--hvsna-primary-color)] opacity-[0.8] rounded-full" />
              )}
              <HvFilter size={20} />
            </Button>
          }
        />
      }
    >
      <div
        className="tasks-scroll-container h-[100%] overflow-y-auto min-h-[400px]"
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
              <HvPlus className="rotate-45" size={16} />
              {t("retry")}
            </button>
          </div>
        )}

        <div
          className={initiated && !loading && !error ? "visible" : "invisible"}
        >
          {tasks.length === 0 ? (
            <EmptyState
              icon={<HvCheck className="w-full h-full" />}
              title={t("no_tasks_yet")}
              description={t("create_first_task_to_get_started")}
            />
          ) : (
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
        </div>
      </div>

      {/* Filter Modal */}
      <Modal
        isOpen={filterModalOpened}
        onClose={handleFilterModalClose}
        title=""
      >
        <TaskFilterModal
          isOpen={filterModalOpened}
          onClose={handleFilterModalClose}
          statusFilter={statusFilter}
          dateRangeFilter={dateRangeFilter}
          searchTextFilter={searchTextFilter}
          unscheduledFilter={unscheduledFilter}
          taskTypeFilter={taskTypeFilter}
          tagFilter={tagFilter}
          onStatusFilterChange={setStatusFilter}
          onDateRangeFilterChange={setDateRangeFilter}
          onSearchTextFilterChange={setSearchTextFilter}
          onUnscheduledFilterChange={setUnscheduledFilter}
          onTaskTypeFilterChange={setTaskTypeFilter}
          onTagFilterChange={setTagFilter}
          onClear={clearFilters}
        />
      </Modal>
    </Page>
  );
}
