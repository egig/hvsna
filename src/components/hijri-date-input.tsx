import { useState, useEffect } from "react";
import { HijriDate, HijriMonth } from "../lib/hijri";
import { Modal } from "../modules/navigation/modal";
import { HIJRI_MONTH_NAMES_EN } from "src/lib/hijri-months";
import { useFeatureFlag } from "src/hooks/useFeatureFlags";

interface HijriDateInputProps {
  name: string;
  label: string;
  value?: HijriDate;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  onChange?: (value: HijriDate) => void;
  onBlur?: () => void;
}

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: HijriDate | null;
  onDateSelect: (date: HijriDate) => void;
}

function CalendarModal({
  isOpen,
  onClose,
  selectedDate,
  onDateSelect,
}: CalendarModalProps) {
  const [currentMonth, setCurrentMonth] = useState<HijriMonth>(
    selectedDate
      ? new HijriMonth(selectedDate.year, selectedDate.month)
      : HijriMonth.fromGregorian(
          new Date().getFullYear(),
          new Date().getMonth() + 1,
        ),
  );
  const [selectedHour, setSelectedHour] = useState(
    selectedDate?.toDate().getHours() || 0,
  );
  const [selectedMinute, setSelectedMinute] = useState(
    selectedDate?.toDate().getMinutes() || 0,
  );
  const [tempSelectedDate, setTempSelectedDate] = useState<HijriDate | null>(
    selectedDate,
  );
  const repeatEnabled = useFeatureFlag("TASK_REPEAT");

  const hijriMonthNames = [
    "Muharram",
    "Safar",
    "Rabi al-Awwal",
    "Rabi al-Thani",
    "Jumada al-Awwal",
    "Jumada al-Thani",
    "Rajab",
    "Shaaban",
    "Ramadan",
    "Shawwal",
    "Dhu al-Qidah",
    "Dhu al-Hijjah",
  ];

  const weekDays = ["Fri", "Sat", "Sun", "Mon", "Tue", "Wed", "Thu"];

  useEffect(() => {
    if (selectedDate) {
      setCurrentMonth(new HijriMonth(selectedDate.year, selectedDate.month));
      setSelectedHour(selectedDate.toDate().getHours());
      setSelectedMinute(selectedDate.toDate().getMinutes());
      setTempSelectedDate(selectedDate);
    }
  }, [selectedDate]);

  const getDaysInMonth = () => {
    return currentMonth.getDaysInMonth();
  };

  const getFirstDayOfMonth = () => {
    return currentMonth.getFirstDay();
  };

  const getCalendarDays = () => {
    const firstDay = getFirstDayOfMonth();
    const daysInMonth = getDaysInMonth();
    const startDayOfWeek = firstDay.dayOfWeek;

    const days = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new HijriDate(currentMonth.year, currentMonth.month, day));
    }

    return days;
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(currentMonth.previous());
  };

  const handleNextMonth = () => {
    setCurrentMonth(currentMonth.next());
  };

  const handleDateClick = (date: HijriDate) => {
    setTempSelectedDate(date);
  };

  const handleConfirm = () => {
    if (tempSelectedDate) {
      const finalDate = new HijriDate(
        tempSelectedDate.year,
        tempSelectedDate.month,
        tempSelectedDate.day,
        selectedHour,
        selectedMinute,
      );
      onDateSelect(finalDate);
      onClose();
    }
  };

  const handleToday = () => {
    const today = HijriDate.fromDate(new Date());
    setCurrentMonth(new HijriMonth(today.year, today.month));
    setTempSelectedDate(today);
    setSelectedHour(today.toDate().getHours());
    setSelectedMinute(today.toDate().getMinutes());
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select Hijri Date">
      <div className="p-4">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handlePreviousMonth}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {hijriMonthNames[currentMonth.month - 1]} {currentMonth.year}
          </h3>

          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="mb-4">
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-xs font-medium text-gray-500 dark:text-gray-400 py-2"
              >
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {getCalendarDays().map((date, index) => (
              <div key={index} className="aspect-square">
                {date ? (
                  <button
                    onClick={() => handleDateClick(date)}
                    className={`w-full h-full flex items-center justify-center rounded-md text-sm transition-colors ${
                      tempSelectedDate &&
                      date.year === tempSelectedDate.year &&
                      date.month === tempSelectedDate.month &&
                      date.day === tempSelectedDate.day
                        ? "bg-blue-500 text-white"
                        : date.isToday()
                          ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300"
                          : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                    }`}
                  >
                    {date.day}
                  </button>
                ) : (
                  <div className="w-full h-full" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Time Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Time
          </label>
          <div className="flex gap-2">
            <select
              value={selectedHour}
              onChange={(e) => setSelectedHour(parseInt(e.target.value))}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>
                  {i.toString().padStart(2, "0")}
                </option>
              ))}
            </select>
            <span className="flex items-center text-gray-500 dark:text-gray-400">
              :
            </span>
            <select
              value={selectedMinute}
              onChange={(e) => setSelectedMinute(parseInt(e.target.value))}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              {Array.from({ length: 60 }, (_, i) => (
                <option key={i} value={i}>
                  {i.toString().padStart(2, "0")}
                </option>
              ))}
            </select>
          </div>

          {repeatEnabled && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Repeat
              </label>
              <select
                name="repeat"
                defaultValue={"none"}
                disabled={false}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="none">No repeat</option>
                <option value="daily">
                  Daily at {selectedHour}:{selectedMinute}
                </option>
                <option value="monthly">
                  Monthly on {tempSelectedDate?.day}
                </option>
                <option value="yearly">
                  Yearly on {tempSelectedDate?.day}{" "}
                  {HIJRI_MONTH_NAMES_EN[tempSelectedDate?.month || 0 - 1]}
                </option>
              </select>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <button
            onClick={handleToday}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            Today
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!tempSelectedDate}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-md transition-colors"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export function HijriDateInput({
  name,
  label,
  value,
  placeholder = "Select Hijri date",
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

  const handleDateSelect = (date: HijriDate) => {
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
    <div className={`mx-4 ${className}`}>
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
