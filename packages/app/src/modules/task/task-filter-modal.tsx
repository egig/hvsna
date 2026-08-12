import { ModalNavbar } from "../navigation";
import { HvCheck, HvX } from "@/modules/icons";
import { NavActionButton } from "../components/nav-action-button";
import { HijriDateRangeInput } from "../calendar/hijri-date-range-input";
import { useLanguageContext } from "../i18n/LanguageContext";
import { useTags } from "./use-tags";

interface TaskFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  dateRangeFilter: { startDate: number; endDate: number } | null;
  searchTextFilter: string;
  unscheduledFilter: boolean;
  tagFilter: string[];
  onDateRangeFilterChange: (
    dateRange: { startDate: number; endDate: number } | null
  ) => void;
  onSearchTextFilterChange: (value: string) => void;
  onUnscheduledFilterChange: (value: boolean) => void;
  onTagFilterChange: (tags: string[]) => void;
  onClear: () => void;
}

export default function TaskFilterModal({
  isOpen,
  onClose,
  dateRangeFilter,
  unscheduledFilter,
  tagFilter,
  onDateRangeFilterChange,
  onUnscheduledFilterChange,
  onTagFilterChange,
  onClear,
}: TaskFilterModalProps) {
  const { t } = useLanguageContext();
  const { tagNames } = useTags();

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
      <ModalNavbar
        title={t("filter_tasks")}
        onModalClose={onClose}
        rightAction={
          <NavActionButton variant="primary" onClick={onClose}>
            <HvCheck size={16} />
          </NavActionButton>
        }
      />
      <div className="flex-1">
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

        {/* Tag Filter */}
        {tagNames.length > 0 && (
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-900 font-semibold">{t("tags")}</span>
              {tagFilter.length > 0 && (
                <span className="text-xs text-gray-500">
                  {t("filter_any_selected")}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {tagNames.map((tag) => {
                const isSelected = tagFilter.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => {
                      if (isSelected) {
                        onTagFilterChange(tagFilter.filter((t) => t !== tag));
                      } else {
                        onTagFilterChange([...tagFilter, tag]);
                      }
                    }}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-[var(--hvsna-primary-color)] text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                    }`}
                  >
                    {tag}
                    {isSelected && <HvX size={12} />}
                  </button>
                );
              })}
            </div>
          </div>
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
