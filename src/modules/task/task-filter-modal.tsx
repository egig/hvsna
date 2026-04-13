import { Button } from "../navigation";
import { Navbar } from "../navigation/navbar";
import { HvCheck } from "@/modules/icons";
import { HijriDate } from "../calendar/hijri/hijri-date";
import { HijriDateRangeInput } from "../calendar/hijri-date-range-input";
import { ListInputSelect } from "../components/list-input-select";
import { useLanguageContext } from "../i18n/LanguageContext";
import type { TaskStatus, TaskTypeFilter } from "./types";
import { useLists } from "./use-lists";

interface TaskFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  statusFilter: number | "all";
  dateRangeFilter: { startDate: HijriDate; endDate: HijriDate } | null;
  searchTextFilter: string;
  unscheduledFilter: boolean;
  taskTypeFilter: TaskTypeFilter;
  listIdFilter: string | null;
  onStatusFilterChange: (value: TaskStatus | "all") => void;
  onDateRangeFilterChange: (
    dateRange: { startDate: HijriDate; endDate: HijriDate } | null
  ) => void;
  onSearchTextFilterChange: (value: string) => void;
  onUnscheduledFilterChange: (value: boolean) => void;
  onTaskTypeFilterChange: (value: TaskTypeFilter) => void;
  onListIdFilterChange: (id: string | null) => void;
  onClear: () => void;
}

export default function TaskFilterModal({
  isOpen,
  onClose,
  statusFilter,
  dateRangeFilter,
  unscheduledFilter,
  listIdFilter,
  onStatusFilterChange,
  onDateRangeFilterChange,
  onUnscheduledFilterChange,
  onListIdFilterChange,
  onClear,
}: TaskFilterModalProps) {
  const { t } = useLanguageContext();
  const { lists } = useLists();

  const statusOptions = [
    { value: "all" as const, label: t("all_status"), color: "bg-gray-500" },
    { value: 0, label: t("to_do"), color: "bg-yellow-500" },
    { value: 1, label: t("completed"), color: "bg-green-500" },
  ];

  const handleClear = () => {
    onClear();
  };

  const handleUnscheduledChange = (value: boolean) => {
    onUnscheduledFilterChange(value);
    if (value) {
      onDateRangeFilterChange(null);
    }
  };

  return (
    <div className="h-full flex flex-col mb-[env(safe-area-inset-bottom)]">
      <Navbar
        title={t("filter_tasks")}
        customBackAction={onClose}
        rightAction={
          <Button
            onClick={onClose}
            className="w-10 h-10 bg-[var(--hvsna-primary-color)] hover:bg-[var(--hvsna-primary-color-hover)] active:bg-[var(--hvsna-primary-color-pressed)] text-white rounded-full transition-colors font-medium shadow-sm flex items-center justify-center"
          >
            <HvCheck size={16} />
          </Button>
        }
        modal={true}
      />
      <div className="flex-1">
        {/* Status Select */}
        <ListInputSelect
          label={t("status")}
          value={statusFilter.toString()}
          onValueChange={(value) => {
            onStatusFilterChange(
              value === "all" ? "all" : (parseInt(value) as TaskStatus)
            );
          }}
          options={statusOptions.map((opt) => ({
            value: opt.value.toString(),
            label: opt.label,
          }))}
        />

        {/* Unscheduled Filter */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-gray-900 font-semibold">
              {t("unscheduled")}
            </span>
            <button
              onClick={() => handleUnscheduledChange(!unscheduledFilter)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                unscheduledFilter
                  ? "bg-[var(--hvsna-primary-color)]"
                  : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  unscheduledFilter ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Date Range */}
        <div className="p-2 border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1 min-w-0 pr-2">
              <span className="text-gray-900 font-semibold text-left truncate">
                {t("select_date_range")}
              </span>
            </div>

            <div className="flex items-center space-x-2 flex-shrink-0 max-w-[50%] min-w-0">
              <HijriDateRangeInput
                value={dateRangeFilter}
                onChange={onDateRangeFilterChange}
                placeholder={t("select_date_range")}
                className="w-full min-w-0"
                disabled={unscheduledFilter}
              />
            </div>
          </div>
        </div>

        {/* List Filter — only shown when user has lists */}
        {lists.length > 0 && (
          <ListInputSelect
            label={t("list")}
            value={listIdFilter ?? ""}
            onValueChange={(value) => {
              onListIdFilterChange(value === "" ? null : value);
            }}
            options={[
              { value: "", label: t("all_lists") },
              ...lists.map((list) => ({
                value: list.id ?? "",
                label: list.name ?? "",
              })),
            ]}
          />
        )}
      </div>

      {/* Clear Filters Button */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleClear}
          className="w-full py-2 px-4 text-sm font-medium text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          {t("clear_filters")}
        </button>
      </div>
    </div>
  );
}
