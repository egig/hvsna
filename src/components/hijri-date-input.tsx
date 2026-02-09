import { useState, useEffect } from "react";
import { HijriDate } from "../lib/hijri";
import { CalendarModal } from "./hijri-date-input/calendar-modal";

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<HijriDate | null>(null);

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
    return date.format("DD MMMM YYYY, HH:mm");
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
        className={`px-3 py-2 text-left border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors ${
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
          <svg
            className="w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      </button>

      <CalendarModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedDate={selectedDate}
        onDateSelect={handleDateSelect}
      />
    </div>
  );
}
