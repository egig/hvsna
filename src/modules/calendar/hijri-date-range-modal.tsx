import { useState, useEffect } from "react";
import { Check, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Modal, Navbar } from "src/modules/navigation";
import { gregorianToHijri, hijriToGregorian } from "@tabby_ai/hijri-converter";
import {
  HijriDate,
  HijriMonth,
  isSameHijriDate,
} from "src/modules/calendar/hijri";
import { useDateFormatter } from "src/modules/calendar/use-date-formatter";
import { useLanguageContext } from "../i18n/LanguageContext";

// Helper functions for date comparison
function isBefore(date1: HijriDate, date2: HijriDate): boolean {
  // Convert to Gregorian dates for comparison
  const greg1 = date1.toDate();
  const greg2 = date2.toDate();
  return greg1 < greg2;
}

function isAfter(date1: HijriDate, date2: HijriDate): boolean {
  // Convert to Gregorian dates for comparison
  const greg1 = date1.toDate();
  const greg2 = date2.toDate();
  return greg1 > greg2;
}

function isSame(date1: HijriDate, date2: HijriDate): boolean {
  return isSameHijriDate(date1, date2);
}

interface DateRange {
  startDate: HijriDate;
  endDate: HijriDate;
}

interface HijriDateRangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRange: DateRange | null;
  onRangeSelect: (range: DateRange | null) => void;
}

export function HijriDateRangeModal({
  isOpen,
  onClose,
  selectedRange,
  onRangeSelect,
}: HijriDateRangeModalProps) {
  const { t } = useLanguageContext();
  const { hijriMonthNames, weekDays } = useDateFormatter();

  const [currentMonth, setCurrentMonth] = useState<HijriMonth>(
    selectedRange?.startDate
      ? new HijriMonth(
          selectedRange.startDate.year,
          selectedRange.startDate.month,
        )
      : (() => {
          const today = HijriDate.fromDate(new Date());
          return new HijriMonth(today.year, today.month);
        })(),
  );

  const [tempStartDate, setTempStartDate] = useState<HijriDate | null>(
    selectedRange?.startDate || null,
  );

  const [tempEndDate, setTempEndDate] = useState<HijriDate | null>(
    selectedRange?.endDate || null,
  );

  useEffect(() => {
    if (selectedRange) {
      setCurrentMonth(
        new HijriMonth(
          selectedRange.startDate.year,
          selectedRange.startDate.month,
        ),
      );
      setTempStartDate(selectedRange.startDate);
      setTempEndDate(selectedRange.endDate);
    }
  }, [selectedRange]);

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
      const gregorianDate = hijriToGregorian({
        year: currentMonth.year,
        month: currentMonth.month,
        day,
      });
      const date = new Date(
        gregorianDate.year,
        gregorianDate.month - 1,
        gregorianDate.day,
      );
      days.push(HijriDate.fromDate(date));
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
    if (!tempStartDate) {
      // First selection - set start date
      setTempStartDate(date);
      setTempEndDate(date);
    } else if (!tempEndDate || isBefore(date, tempStartDate)) {
      // Set new start date if clicking before current start, or if no end date yet
      setTempStartDate(date);
      setTempEndDate(date);
    } else {
      // Set end date
      setTempEndDate(date);
      if (isBefore(date, tempStartDate)) {
        // If end is before start, swap them
        setTempStartDate(date);
        setTempEndDate(tempStartDate);
      }
    }
  };

  const handleConfirm = () => {
    if (tempStartDate && tempEndDate) {
      const range: DateRange = {
        startDate: isBefore(tempStartDate, tempEndDate)
          ? tempStartDate
          : tempEndDate,
        endDate: isAfter(tempEndDate, tempStartDate)
          ? tempEndDate
          : tempStartDate,
      };
      onRangeSelect(range);
      onClose();
    }
  };

  const handleClear = () => {
    setTempStartDate(null);
    setTempEndDate(null);
  };

  const isDateInSelectedRange = (date: HijriDate) => {
    if (!tempStartDate || !tempEndDate) return false;

    const start = isBefore(tempStartDate, tempEndDate)
      ? tempStartDate
      : tempEndDate;
    const end = isAfter(tempEndDate, tempStartDate)
      ? tempEndDate
      : tempStartDate;

    return (
      (isAfter(date, start) || isSame(date, start)) &&
      (isBefore(date, end) || isSame(date, end))
    );
  };

  const isDateStartOrEnd = (date: HijriDate) => {
    if (!tempStartDate || !tempEndDate) return false;

    return isSame(date, tempStartDate) || isSame(date, tempEndDate);
  };

  const getDateButtonClass = (date: HijriDate) => {
    const baseClass =
      "w-full h-full flex items-center justify-center rounded-md text-sm transition-colors ";

    if (isDateStartOrEnd(date)) {
      return baseClass + "bg-[var(--hvsna-primary-color)] text-white";
    } else if (isDateInSelectedRange(date)) {
      return (
        baseClass +
        "bg-[var(--hvsna-primary-color-active-tab)] dark:bg-blue-900 text-white dark:text-white"
      );
    } else if (date.isToday()) {
      return (
        baseClass +
        "bg-blue-100 dark:bg-blue-800 text-blue-900 dark:text-blue-100"
      );
    } else {
      return (
        baseClass +
        "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
      );
    }
  };

  const formatDateDisplay = (date: HijriDate) => {
    if (date.isToday()) {
      return t("today");
    }

    if (date.isTomorrow()) {
      return t("tomorrow");
    }

    return date.format("DD MMMM YYYY");
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <Navbar
        title={t("select_date_range")}
        customBackAction={onClose}
        rightAction={
          <button
            onClick={handleConfirm}
            disabled={!tempStartDate || !tempEndDate}
            className="rounded-full w-10 h-10 flex items-center justify-center text-sm font-medium text-white bg-[var(--hvsna-primary-color)] hover:bg-[var(--hvsna-primary-color-hover)] active:bg-[var(--hvsna-primary-color-pressed)] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <Check />
          </button>
        }
      />

      <div className="pb-[env(safe-area-inset-bottom)]">
        {/* Selected Range Display */}
        {(tempStartDate || tempEndDate) && (
          <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                {tempStartDate && tempEndDate ? (
                  <>
                    <div>
                      {t("start_date")}: {formatDateDisplay(tempStartDate)}
                    </div>
                    <div>
                      {t("end_date")}: {formatDateDisplay(tempEndDate)}
                    </div>
                  </>
                ) : tempStartDate ? (
                  <div>
                    {t("start_date")}: {formatDateDisplay(tempStartDate)}
                  </div>
                ) : null}
              </div>
              <button
                onClick={handleClear}
                className="px-3 py-1 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
              >
                {t("clear")}
              </button>
            </div>
          </div>
        )}

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
        <div className="p-2 pb-4">
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
                    className={getDateButtonClass(date)}
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
