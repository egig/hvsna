import { useState } from "react";
import { Button } from "../navigation";
import { Modal } from "../navigation/modal";
import { ChevronRight, Check } from "lucide-react";
import { HijriDate } from "../../lib/hijri";
import { HijriDateInput } from "../../components/hijri-date-input";

interface TaskFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  statusFilter: string;
  dateRangeFilter: { startDate: HijriDate; endDate: HijriDate } | null;
  searchTextFilter: string;
  onStatusFilterChange: (value: string) => void;
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
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [dateRangeModalOpen, setDateRangeModalOpen] = useState(false);

  const statusOptions = [
    { value: "all", label: "All Tasks", color: "bg-gray-500" },
    { value: "pending", label: "Pending", color: "bg-yellow-500" },
    { value: "in_progress", label: "In Progress", color: "bg-blue-500" },
    { value: "completed", label: "Completed", color: "bg-green-500" },
  ];

  const currentStatusLabel =
    statusOptions.find((opt) => opt.value === statusFilter)?.label ||
    "All Tasks";

  const formatDateForDisplay = (date: HijriDate) => {
    return date.format("DD MMMM YYYY");
  };

  const currentDateRangeLabel = dateRangeFilter
    ? `${formatDateForDisplay(dateRangeFilter.startDate)} - ${formatDateForDisplay(dateRangeFilter.endDate)}`
    : "All Time";

  const handleClear = () => {
    onStatusFilterChange("all");
    onDateRangeFilterChange(null);
    onSearchTextFilterChange("");
    onClear();
  };

  const handleStatusSelect = (value: string) => {
    onStatusFilterChange(value);
    setStatusModalOpen(false);
  };

  return (
    <div className="p-4">
      <div className="space-y-4">
        {/* Search Text Input */}
        <div className="w-full p-4 bg-white dark:bg-gray-800 border-b border-gray-200">
          <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium block mb-2">
            Search
          </label>
          <input
            type="text"
            value={searchTextFilter}
            onChange={(e) => onSearchTextFilterChange(e.target.value)}
            placeholder="Search title or description..."
            className="w-full px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Status List Item */}
        <button
          onClick={() => setStatusModalOpen(true)}
          className="w-full flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${statusOptions.find((opt) => opt.value === statusFilter)?.color || "bg-gray-500"}`}
            />
            <div className="text-left">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">
                Status
              </p>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {currentStatusLabel}
              </p>
            </div>
          </div>
          <ChevronRight size={20} className="text-gray-400" />
        </button>
      </div>

      <div className="flex flex-row gap-2 mt-2">
        <div>
          <label className="hidden text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Start Date
          </label>
          <HijriDateInput
            name="startDate"
            label=""
            value={dateRangeFilter?.startDate}
            onChange={(startDate) => {
              const endDate = dateRangeFilter?.endDate || startDate;
              onDateRangeFilterChange({ startDate, endDate });
            }}
            placeholder="start date"
          />
        </div>

        <div>
          <label className="hidden text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            End Date
          </label>
          <HijriDateInput
            name="endDate"
            label=""
            value={dateRangeFilter?.endDate}
            onChange={(endDate) => {
              const startDate = dateRangeFilter?.startDate || endDate;
              onDateRangeFilterChange({ startDate, endDate });
            }}
            placeholder="End date"
          />
        </div>
      </div>
      <div className="mt-2">
        {dateRangeFilter && (
          <button
            onClick={() => onDateRangeFilterChange(null)}
            className="w-full px-4 py-2 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            Clear Date Range
          </button>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
        <Button
          onClick={handleClear}
          className="px-6 py-2.5 text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium"
        >
          Clear
        </Button>
        <Button
          onClick={onClose}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
        >
          Apply
        </Button>
      </div>

      {/* Status Selection Modal */}
      <Modal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        title="Select Status"
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
