import { Button } from "../navigation";
import { Navbar } from "../navigation/navbar";
import { Check } from "lucide-react";
import { HijriDate } from "../calendar/hijri/hijri-date";
import { HijriDateRangeInput } from "../calendar/hijri-date-range-input";
import { ListInputSelect } from "../../ui/list-input-select";
import { useLanguageContext } from "../i18n/LanguageContext";

interface TaskFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  statusFilter: number | "all";
  dateRangeFilter: { startDate: HijriDate; endDate: HijriDate } | null;
  searchTextFilter: string;
  onStatusFilterChange: (value: number | "all") => void;
  onDateRangeFilterChange: (
    dateRange: { startDate: HijriDate; endDate: HijriDate } | null,
  ) => void;
  onSearchTextFilterChange: (value: string) => void;
  onClear: () => void;
}

export default function TaskFilterModal({
  isOpen,
  onClose,
  statusFilter,
  dateRangeFilter,
  searchTextFilter,
  onStatusFilterChange,
  onDateRangeFilterChange,
  onSearchTextFilterChange,
  onClear,
}: TaskFilterModalProps) {
  const { t } = useLanguageContext();
  const statusOptions = [
    { value: "all" as const, label: t("all_status"), color: "bg-gray-500" },
    { value: 0, label: t("to_do"), color: "bg-yellow-500" },
    { value: 1, label: t("completed"), color: "bg-green-500" },
  ];

  const currentStatusLabel =
    statusOptions.find((opt) => opt.value === statusFilter)?.label ||
    t("all_tasks");

  const formatDateForDisplay = (date: HijriDate) => {
    return date.format("DD MMMM YYYY");
  };

  const currentDateRangeLabel = dateRangeFilter
    ? `${formatDateForDisplay(dateRangeFilter.startDate)} - ${formatDateForDisplay(dateRangeFilter.endDate)}`
    : t("all_time");

  const handleClear = () => {
    onStatusFilterChange("all");
    onDateRangeFilterChange(null);
    onSearchTextFilterChange("");
    onClear();
    onClose();
  };

  return (
    <div className="h-full flex flex-col mb-[env(safe-area-inset-bottom)]">
      <Navbar
        title={t("filter_tasks")}
        customBackAction={handleClear}
        rightAction={
          <Button
            onClick={onClose}
            className="w-10 h-10 bg-[var(--hvsna-primary-color)] hover:bg-[var(--hvsna-primary-color-hover)] active:bg-[var(--hvsna-primary-color-pressed)] text-white rounded-full transition-colors font-medium shadow-sm flex items-center justify-center"
          >
            <Check size={16} />
          </Button>
        }
        modal={true}
      />
      <div className="flex-1">
        {/* Status Select */}
        <ListInputSelect
          label={t("status")}
          value={statusFilter.toString()}
          onValueChange={(value) =>
            onStatusFilterChange(value === "all" ? "all" : parseInt(value))
          }
          options={statusOptions.map((opt) => ({
            value: opt.value.toString(),
            label: opt.label,
          }))}
        />
      </div>

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
            />
          </div>
        </div>
      </div>
    </div>
  );
}
