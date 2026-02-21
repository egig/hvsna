import { useState } from "react";
import { Button } from "../navigation";
import { Modal } from "../navigation/modal";
import { Navbar } from "../navigation/navbar";
import { ChevronRight, Check } from "lucide-react";
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
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [dateRangeModalOpen, setDateRangeModalOpen] = useState(false);

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

  const handleStatusSelect = (value: number | "all") => {
    onStatusFilterChange(value);
    setStatusModalOpen(false);
  };

  return (
    <div className="h-full flex flex-col">
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
      <div className="flex-1 mb-2 pb-[env(safe-area-inset-bottom)]">
        {/* Search Text Input */}
        <div className="w-full p-2 bg-white dark:bg-gray-800">
          <label className="hidden">{t("search")}</label>
          <input
            type="text"
            value={searchTextFilter}
            onChange={(e) => onSearchTextFilterChange(e.target.value)}
            placeholder={t("search_title_or_description")}
            className="w-full px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

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

      <div className="p-2 flex flex-row gap-2 mt-2 items-center justify-between">
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
      <div className="my-2 px-2">
        {dateRangeFilter && (
          <button
            onClick={() => onDateRangeFilterChange(null)}
            className="w-full px-4 py-2 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            {t("clear_date_range")}
          </button>
        )}
      </div>

      {/* Status Selection Modal */}
      <Modal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        title={t("select_status")}
      >
        <div className="space-y-2">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleStatusSelect(option.value)}
              className={`w-full flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 transition-colors ${
                statusFilter === option.value
                  ? "hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  : "hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${option.color}`} />
                <span
                  className={`font-medium ${
                    statusFilter === option.value
                      ? "text-blue-900 dark:text-blue-100"
                      : "text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {option.label}
                </span>
              </div>
              {statusFilter === option.value && (
                <Check size={20} className="text-blue-600" />
              )}
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}
