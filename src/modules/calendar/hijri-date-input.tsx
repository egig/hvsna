import { useState, useEffect } from "react";
import { HijriDate } from "./hijri";
import { CalendarModal } from "./hijri-date-input/calendar-modal";
import { CalendarIcon } from "lucide-react";
import { useLanguageContext } from "../i18n/LanguageContext";
import { useHijriCalendar } from "./hijri/useHijriCalendar";

interface HijriDateInputProps {
  name: string;
  label: string;
  value?: HijriDate;
  timeValue?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  onChange?: (value: HijriDate | null, time: string | null) => void;
  onBlur?: () => void;
}

export function HijriDateInput({
  name,
  label,
  value,
  timeValue,
  placeholder = "",
  disabled = false,
  required = false,
  className = "",
  onChange,
  onBlur,
}: HijriDateInputProps) {
  const { isToday, isTomorrow, formatDate } = useHijriCalendar();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<HijriDate | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const { t } = useLanguageContext();

  // Initialize from Gregorian value
  useEffect(() => {
    if (value) {
      setSelectedDate(value);
      setSelectedTime(timeValue || null);
    } else {
      setSelectedDate(null);
      setSelectedTime(null);
    }
  }, [value]);

  const handleDateSelect = (date: HijriDate | null, time: string | null) => {
    setSelectedDate(date);
    setSelectedTime(time);
    if (onChange) {
      onChange(date, time);
    }
  };

  const formatDateDisplay = (date: HijriDate | null, time: string | null) => {
    if (!date) return placeholder;

    if (isToday(date)) {
      return t("today") + (time ? `, ${time}` : "");
    }

    if (isTomorrow(date)) {
      return t("tomorrow") + (time ? `, ${time}` : "");
    }

    return formatDate(date, "DD MMMM") + (time ? `, ${time}` : "");
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
            {formatDateDisplay(selectedDate, selectedTime)}
          </span>
          <CalendarIcon className="w-5 h-5 text-gray-400" />
        </div>
      </button>

      <CalendarModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        onDateSelect={handleDateSelect}
      />
    </div>
  );
}
