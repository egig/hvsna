import { useState, useEffect } from "react";
import { HijriDateRangeModal } from "./hijri-date-range-modal";
import { HvCalendar, HvX } from "@/modules/icons";
import { useLanguageContext } from "../i18n/LanguageContext";
import dayjs from "dayjs";

interface DateRange {
  startDate: number; // epoch ms
  endDate: number; // epoch ms
}

interface HijriDateRangeInputProps {
  value?: DateRange | null;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  onChange?: (value: DateRange | null) => void;
}

export function HijriDateRangeInput({
  value,
  placeholder = "",
  disabled = false,
  className = "",
  onChange,
}: HijriDateRangeInputProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState<DateRange | null>(null);
  const { t } = useLanguageContext();

  // Initialize from value
  useEffect(() => {
    setSelectedRange(value || null);
  }, [value]);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedRange(null);
    if (onChange) {
      onChange(null);
    }
  };

  const handleRangeSelect = (range: DateRange | null) => {
    setSelectedRange(range);
    if (onChange) {
      onChange(range);
    }
    setIsModalOpen(false);
  };

  const formatDateDisplay = (epoch: number) => {
    const d = dayjs(epoch);
    if (d.isSame(dayjs(), "day")) return t("today");
    if (d.isSame(dayjs().add(1, "day"), "day")) return t("tomorrow");
    return d.format("DD MMMM YYYY");
  };

  const formatDateRangeDisplay = (range: DateRange | null) => {
    if (!range) return placeholder;

    const start = dayjs(range.startDate);
    const end = dayjs(range.endDate);

    if (start.isSame(end, "day")) {
      return formatDateDisplay(range.startDate);
    }

    return `${formatDateDisplay(range.startDate)} - ${formatDateDisplay(
      range.endDate
    )}`;
  };

  return (
    <div className={`${className} w-full`}>
      <button
        type="button"
        onClick={() => !disabled && setIsModalOpen(true)}
        disabled={disabled}
        className={`
          w-full px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm
          hover:bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white
          touch-manipulation min-w-0 truncate
          ${
            disabled
              ? "bg-gray-100 dark:bg-gray-600 cursor-not-allowed opacity-50"
              : "bg-white dark:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 cursor-pointer"
          }
        `}
      >
        <div className="flex items-center justify-between gap-2 w-full">
          <span
            className={`
              truncate flex-1 min-w-0 text-left
              ${
                selectedRange
                  ? "text-gray-900 dark:text-white"
                  : "text-gray-500 dark:text-gray-400"
              }
            `}
          >
            {formatDateRangeDisplay(selectedRange)}
          </span>
          <div className="flex items-center gap-1 flex-shrink-0">
            {selectedRange && (
              <span
                onClick={handleClear}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                title={t("clear")}
              >
                <HvX className="w-3 h-3" />
              </span>
            )}
            <HvCalendar className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      </button>

      <HijriDateRangeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedRange={selectedRange}
        onRangeSelect={handleRangeSelect}
      />
    </div>
  );
}
