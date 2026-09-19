import { useState } from "react";
import { HvPlus, HvCheck, HvFilter } from "@/modules/icons";
import { NavbarDesktop as Navbar } from "./navbar-desktop";
import { Modal } from "./modal";
import { EmptyState } from "@/modules/components/empty-state";
import TaskFilterModal from "@/modules/task/task-filter-modal";
import { PageDesktop as Page } from "./page";
import TaskListItem from "@/modules/task/task-list-item";
import { useSearch } from "@/modules/task/use-search";
import { useLanguageContext } from "@/modules/i18n/LanguageContext";

export default function Search() {
  const { t } = useLanguageContext();
  const [filterModalOpened, setFilterModalOpened] = useState(false);

  const {
    tasks,
    loading,
    initiated,
    error,
    refreshTasks,
    dateRangeFilter,
    searchTextFilter,
    unscheduledFilter,
    tagFilter,
    setDateRangeFilter,
    setSearchTextFilter,
    setUnscheduledFilter,
    setTagFilter,
    clearFilters,
  } = useSearch();

  const handleFilterModalClose = () => {
    setFilterModalOpened(false);
  };

  const hasFilter = () => {
    return (
      searchTextFilter !== "" ||
      !!dateRangeFilter ||
      unscheduledFilter ||
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
            <button
              onClick={() => setFilterModalOpened(true)}
              aria-label={t("filter_options")}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-500"
            >
              {hasFilter() && (
                <div className="absolute w-2 h-2 bg-[var(--hvsna-primary-color)] opacity-[0.8] rounded-full" />
              )}
              <HvFilter size={20} />
            </button>
          }
        />
      }
    >
      <div className="min-h-[400px]">
        {initiated && error && (
          <div className="text-center py-8">
            <div className="text-red-600 mb-4">
              {t("error_colon", { error })}
            </div>
            <button
              onClick={refreshTasks}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 mx-auto"
            >
              <HvPlus className="rotate-45" size={20} />
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
                <TaskListItem key={task.id} task={task} />
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
          dateRangeFilter={dateRangeFilter}
          searchTextFilter={searchTextFilter}
          unscheduledFilter={unscheduledFilter}
          tagFilter={tagFilter}
          onDateRangeFilterChange={setDateRangeFilter}
          onSearchTextFilterChange={setSearchTextFilter}
          onUnscheduledFilterChange={setUnscheduledFilter}
          onTagFilterChange={setTagFilter}
          onClear={clearFilters}
        />
      </Modal>
    </Page>
  );
}
