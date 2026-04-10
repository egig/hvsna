import { useState, useEffect } from "react";
import { HijriDate } from "./hijri";
import { CalendarModal } from "./hijri-date-input/calendar-modal";
import { HvCalendar } from "@src/modules/icons";
import { useLanguageContext } from "../i18n/LanguageContext";
import { useHijriDate } from "./hijri/use-hijri-date";

interface HijriDateInputProps {
  name: string;
  label: string;
  value?: HijriDate;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  onChange?: (value: HijriDate | null) => void;
  onBlur?: () => void;
}

export function HijriDateInput({
  name,
  label,
  value,
  placeholder = "",
  disabled = false,
  required = false,
  className = "",
  onChange,
  onBlur,
}: HijriDateInputProps) {
  const { isToday, isTomorrow, formatDate } = useHijriDate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<HijriDate | null>(null);
  const { t } = useLanguageContext();

  // Initialize from Gregorian value
  useEffect(() => {
    if (value) {
      setSelectedDate(value);
    } else {
      setSelectedDate(null);
    }
  }, [value]);

  const handleDateSelect = (date: HijriDate | null) => {
    setSelectedDate(date);
    if (onChange) {
      onChange(date);
    }
  };

  const formatDateDisplay = (date: HijriDate | null) => {
    if (!date) return placeholder;

    if (isToday(date)) {
      return t("today");
    }

    if (isTomorrow(date)) {
      return t("tomorrow");
    }

    return formatDate(date, "DD MMMM");
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
        className={`h-[100%] px-2 text-left border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors ${
          disabled
            ? "bg-gray-100 dark:bg-gray-600 cursor-not-allowed opacity-50"
            : "bg-white dark:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 cursor-pointer"
        }`}
      >
        <div className="flex items-center justify-between gap-1">
          <span
            className={
              selectedDate
                ? "text-gray-900 dark:text-white"
                : "text-gray-500 dark:text-gray-400"
            }
          >
            {formatDateDisplay(selectedDate)}
          </span>
          <HvCalendar className="w-5 h-5 text-gray-400" />
        </div>
      </button>

      <CalendarModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedDate={selectedDate}
        onConfirm={(date) => handleDateSelect(date)}
      />
    </div>
  );
}
