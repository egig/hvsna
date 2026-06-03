import { HvChevronLeft, HvChevronRight } from "@/modules/icons";
import { useDateTranslationHelper } from "./use-date-translation-helper";
import {
  HijriDate,
  HijriMonth,
  isSameHijriDate,
  useHijriDate,
} from "src/modules/calendar/hijri";

function isBefore(date1: HijriDate, date2: HijriDate): boolean {
  return date1.toDate() < date2.toDate();
}

function isAfter(date1: HijriDate, date2: HijriDate): boolean {
  return date1.toDate() > date2.toDate();
}

function isSame(date1: HijriDate, date2: HijriDate): boolean {
  return isSameHijriDate(date1, date2);
}

interface HijriRangeCalendarGridProps {
  currentMonth: HijriMonth;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  startDate: HijriDate | null;
  endDate: HijriDate | null;
  onDateClick: (date: HijriDate) => void;
}

export function HijriRangeCalendarGrid({
  currentMonth,
  onPreviousMonth,
  onNextMonth,
  startDate,
  endDate,
  onDateClick,
}: HijriRangeCalendarGridProps) {
  const { weekDays, hijriMonthNames, gregorianMonthNames } =
    useDateTranslationHelper();
  const { createHijriDate } = useHijriDate();

  const getCalendarDays = () => {
    const firstDay = currentMonth.getFirstDay();
    const daysInMonth = currentMonth.getDaysInMonth();
    const days: (HijriDate | null)[] = [];
    for (let i = 0; i < firstDay.dayOfWeek; i++) days.push(null);
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(createHijriDate(currentMonth.year, currentMonth.month, day));
    }
    return days;
  };

  const firstGreg = createHijriDate(
    currentMonth.year,
    currentMonth.month,
    1
  ).toDate();
  const lastGreg = createHijriDate(
    currentMonth.year,
    currentMonth.month,
    currentMonth.getDaysInMonth()
  ).toDate();

  const isDateInSelectedRange = (date: HijriDate) => {
    if (!startDate || !endDate) return false;
    const start = isBefore(startDate, endDate) ? startDate : endDate;
    const end = isAfter(endDate, startDate) ? endDate : startDate;
    return (
      (isAfter(date, start) || isSame(date, start)) &&
      (isBefore(date, end) || isSame(date, end))
    );
  };

  const isDateStartOrEnd = (date: HijriDate) => {
    if (!startDate || !endDate) return false;
    return isSame(date, startDate) || isSame(date, endDate);
  };

  const getDateButtonClass = (date: HijriDate) => {
    const base =
      "w-full flex flex-col p-1 items-center justify-center rounded-md text-sm transition-colors ";
    if (isDateStartOrEnd(date))
      return base + "bg-[var(--hvsna-primary-color)] text-white";
    if (isDateInSelectedRange(date))
      return (
        base +
        "bg-[var(--hvsna-primary-color-active-tab)] dark:bg-blue-900 text-white dark:text-white"
      );
    if (date.isToday())
      return (
        base + "bg-blue-100 dark:bg-blue-800 text-blue-900 dark:text-blue-100"
      );
    return (
      base +
      "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between p-2 gap-2">
        <button
          onClick={onPreviousMonth}
          className="p-2 bg-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
        >
          <HvChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex flex-col items-center">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">
            {hijriMonthNames[currentMonth.month - 1]} {currentMonth.year}
          </h3>
          <p className="text-xs">
            {firstGreg.getDate()} {gregorianMonthNames[firstGreg.getMonth()]} –{" "}
            {lastGreg.getDate()} {gregorianMonthNames[lastGreg.getMonth()]}
          </p>
        </div>
        <button
          onClick={onNextMonth}
          className="p-2 bg-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
        >
          <HvChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="p-2 border-y border-gray-200">
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
                  onClick={() => onDateClick(date)}
                  className={getDateButtonClass(date)}
                >
                  <div className="text-base">{date.day}</div>
                  <div className="text-[0.625rem]">
                    {date.toDate().getDate()}
                  </div>
                </button>
              ) : (
                <div className="w-full h-full" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
