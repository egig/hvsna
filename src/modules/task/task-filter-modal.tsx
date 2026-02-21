import { Button } from "../navigation";
import { Navbar } from "../navigation/navbar";
import { Check } from "lucide-react";
import { HijriDate } from "../calendar/hijri";
import { SimpleHijriDateInput } from "../calendar/simple-hijri-date-input";
import Select from "../../ui/form-select";
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
        <div className="p-2 bg-white dark:bg-gray-800">
          <Select
            name="status"
            label={t("status")}
            value={statusFilter}
            options={statusOptions}
            onChange={(e) => onStatusFilterChange(e.target.value)}
          />
        </div>
      </div>

      <div className="p-2 flex flex-row gap-2 items-center justify-between">
        <div className="bg-white dark:bg-gray-800">
          <label className="hidden">{t("start_date")}</label>
          <SimpleHijriDateInput
            value={dateRangeFilter?.startDate}
            onChange={(startDate) => {
              if (startDate) {
                const endDate = dateRangeFilter?.endDate || startDate;
                onDateRangeFilterChange({ startDate, endDate });
              }
            }}
            placeholder={t("start_date")}
          />
        </div>
        <div>{t("to")}</div>
        <div className="bg-white dark:bg-gray-800">
          <label className="hidden">{t("end_date")}</label>
          <SimpleHijriDateInput
            value={dateRangeFilter?.endDate}
            onChange={(endDate) => {
              if (endDate) {
                const startDate = dateRangeFilter?.startDate || endDate;
                onDateRangeFilterChange({ startDate, endDate });
              }
            }}
            placeholder={t("end_date")}
          />
        </div>
      </div>
    </div>
  );
}
