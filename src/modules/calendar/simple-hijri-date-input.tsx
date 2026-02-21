import { useState, useEffect } from "react";
import { HijriDate } from "./hijri";
import { SimpleCalendarModal } from "./simple-calendar-modal";
import { CalendarIcon } from "lucide-react";
import { useLanguageContext } from "../i18n/LanguageContext";

interface SimpleHijriDateInputProps {
  value?: HijriDate;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  onChange?: (value: HijriDate | null) => void;
}

export function SimpleHijriDateInput({
  value,
  placeholder = "",
  disabled = false,
  className = "",
  onChange,
}: SimpleHijriDateInputProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<HijriDate | null>(null);
  const { t } = useLanguageContext();

  // Initialize from value
  useEffect(() => {
    setSelectedDate(value || null);
  }, [value]);

  const handleDateSelect = (date: HijriDate | null) => {
    setSelectedDate(date);
    if (onChange) {
      onChange(date);
    }
    setIsModalOpen(false);
  };

  const formatDateDisplay = (date: HijriDate | null) => {
    if (!date) return placeholder;

    if (date.isToday()) {
      return t("today");
    }

    if (date.isTomorrow()) {
      return t("tomorrow");
    }

    return date.format("DD MMMM YYYY");
  };

  const handleButtonClick = () => {
    if (!disabled) {
      setIsModalOpen(true);
    }
  };

  return (
    <div className={`${className}`}>
      <button
        type="button"
        onClick={handleButtonClick}
        disabled={disabled}
        className={`w-full px-3 py-2 text-left border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors ${
          disabled
            ? "bg-gray-100 dark:bg-gray-600 cursor-not-allowed opacity-50"
            : "bg-white dark:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 cursor-pointer"
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <span
            className={
              selectedDate
                ? "text-gray-900 dark:text-white"
                : "text-gray-500 dark:text-gray-400"
            }
          >
            {formatDateDisplay(selectedDate)}
          </span>
          <CalendarIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
        </div>
      </button>

      <SimpleCalendarModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedDate={selectedDate}
        onDateSelect={handleDateSelect}
      />
    </div>
  );
}
