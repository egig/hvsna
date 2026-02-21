import { useState, useEffect } from "react";
import { Check, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Modal, Navbar } from "src/modules/navigation";
import { HijriDate, HijriMonth } from "src/modules/calendar/hijri";
import { useDateFormatter } from "src/modules/calendar/use-date-formatter";
import { useLanguageContext } from "../i18n/LanguageContext";

interface SimpleCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: HijriDate | null;
  onDateSelect: (date: HijriDate | null) => void;
}

export function SimpleCalendarModal({
  isOpen,
  onClose,
  selectedDate,
  onDateSelect,
}: SimpleCalendarModalProps) {
  const { t } = useLanguageContext();
  const { hijriMonthNames, weekDays } = useDateFormatter();

  const [currentMonth, setCurrentMonth] = useState<HijriMonth>(
    selectedDate
      ? new HijriMonth(selectedDate.year, selectedDate.month)
      : HijriMonth.fromGregorian(
          new Date().getFullYear(),
          new Date().getMonth() + 1,
        ),
  );
  const [tempSelectedDate, setTempSelectedDate] = useState<HijriDate | null>(
    selectedDate,
  );

  useEffect(() => {
    if (selectedDate) {
      setCurrentMonth(new HijriMonth(selectedDate.year, selectedDate.month));
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
      onDateSelect(tempSelectedDate);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <Navbar
        title={t("select_date")}
        rightAction={
          <button
            onClick={handleConfirm}
            disabled={!tempSelectedDate}
            className="rounded-full w-10 h-10 flex items-center justify-center text-sm font-medium text-white bg-[var(--hvsna-primary-color)] hover:bg-[var(--hvsna-primary-color-hover)] active:bg-[var(--hvsna-primary-color-pressed)] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <Check />
          </button>
        }
      />

      <div className="pb-[env(safe-area-inset-bottom)]">
        {/* Month Navigation */}
        <div className="flex items-center justify-between p-2">
          <button
            onClick={handlePreviousMonth}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>

          <h3 className="text-m text-gray-900 dark:text-white">
            {hijriMonthNames[currentMonth.month - 1]} {currentMonth.year}
          </h3>

          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="p-2">
          <div className="grid grid-cols-7 gap-1 text-center">
            {weekDays.map((day: string) => (
              <div
                key={day}
                className="text-xs font-medium text-gray-500 dark:text-gray-400"
              >
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {getCalendarDays().map((date, index) => (
              <div key={index} className="aspect-3/2">
                {date ? (
                  <button
                    onClick={() => handleDateClick(date)}
                    className={`w-full h-full flex items-center justify-center rounded-md text-sm transition-colors ${
                      tempSelectedDate &&
                      date.year === tempSelectedDate.year &&
                      date.month === tempSelectedDate.month &&
                      date.day === tempSelectedDate.day
                        ? "bg-[var(--hvsna-primary-color)] text-white"
                        : date.isToday()
                          ? "bg-[var(--hvsna-primary-color-active-tab)] dark:bg-blue-900 text-white dark:text-white"
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
      </div>
    </Modal>
  );
}
