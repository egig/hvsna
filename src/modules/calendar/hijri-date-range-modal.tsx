import { useState, useEffect } from "react";
import { HvCheck, HvChevronLeft, HvChevronRight } from "@/modules/icons";
import { NavActionButton } from "../components/nav-action-button";
import { Modal, Navbar } from "src/modules/navigation";
import { gregorianToHijri, hijriToGregorian } from "@tabby_ai/hijri-converter";
import { Tabs } from "@base-ui/react/tabs";
import {
  HijriDate,
  HijriMonth,
  isSameHijriDate,
  useHijriDate,
} from "src/modules/calendar/hijri";
import { useDateTranslationHelper } from "src/modules/calendar/use-date-translation-helper";
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
  const { t, language } = useLanguageContext();
  const { hijriMonthNames, weekDays } = useDateTranslationHelper();
  const { createHijriDate, createHijriMonth, currentHijriMonth, toHijriDate } =
    useHijriDate();

  const [currentMonth, setCurrentMonth] = useState<HijriMonth>(
    selectedRange?.startDate
      ? createHijriMonth(
          selectedRange.startDate.year,
          selectedRange.startDate.month
        )
      : currentHijriMonth()
  );

  const [tempStartDate, setTempStartDate] = useState<HijriDate | null>(
    selectedRange?.startDate || null
  );

  const [tempEndDate, setTempEndDate] = useState<HijriDate | null>(
    selectedRange?.endDate || null
  );

  const [calendarMode, setCalendarMode] = useState<"hijri" | "gregorian">(
    "hijri"
  );
  const [gregYear, setGregYear] = useState(() => new Date().getFullYear());
  const [gregMonth, setGregMonth] = useState(() => new Date().getMonth());

  useEffect(() => {
    if (selectedRange) {
      setCurrentMonth(
        new HijriMonth(
          selectedRange.startDate.year,
          selectedRange.startDate.month
        )
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
      days.push(createHijriDate(currentMonth.year, currentMonth.month, day));
    }

    return days;
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(currentMonth.previous());
  };

  const handleNextMonth = () => {
    setCurrentMonth(currentMonth.next());
  };

  // Gregorian calendar helpers
  const getGregCalendarDays = (): (Date | null)[] => {
    const firstDayJs = new Date(gregYear, gregMonth, 1).getDay();
    const offset = (firstDayJs - 5 + 7) % 7; // week starts Friday
    const daysInMonth = new Date(gregYear, gregMonth + 1, 0).getDate();
    const days: (Date | null)[] = [];
    for (let i = 0; i < offset; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++)
      days.push(new Date(gregYear, gregMonth, d));
    return days;
  };

  const handleGregPrev = () => {
    if (gregMonth === 0) {
      setGregYear((y) => y - 1);
      setGregMonth(11);
    } else {
      setGregMonth((m) => m - 1);
    }
  };

  const handleGregNext = () => {
    if (gregMonth === 11) {
      setGregYear((y) => y + 1);
      setGregMonth(0);
    } else {
      setGregMonth((m) => m + 1);
    }
  };

  const handleGregDateClick = (date: Date) => {
    const hijriDate = toHijriDate(date);
    if (!tempStartDate) {
      setTempStartDate(hijriDate.startOfDay());
      setTempEndDate(hijriDate.endOfDay());
    } else if (!tempEndDate || isBefore(hijriDate, tempStartDate)) {
      // Set new start date if clicking before current start, or if no end date yet
      setTempStartDate(hijriDate.startOfDay());
      setTempEndDate(hijriDate.endOfDay());
    } else {
      // Set end date
      setTempEndDate(hijriDate.endOfDay());
      if (isBefore(hijriDate, tempStartDate)) {
        // If end is before start, swap them
        setTempStartDate(hijriDate.startOfDay());
        setTempEndDate(tempStartDate.endOfDay());
      }
    }
  };

  const isGregToday = (date: Date) => {
    const now = new Date();
    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate()
    );
  };

  const isGregSelected = (date: Date) => {
    if (!tempStartDate || !tempEndDate) return false;
    const startJs = tempStartDate.toDate();
    const endJs = tempEndDate.toDate();
    return (
      (date >= startJs && date <= endJs) ||
      date.getTime() === startJs.getTime() ||
      date.getTime() === endJs.getTime()
    );
  };

  const isGregStartOrEnd = (date: Date) => {
    if (!tempStartDate || !tempEndDate) return false;
    const startJs = tempStartDate.toDate();
    const endJs = tempEndDate.toDate();
    return (
      date.getTime() === startJs.getTime() || date.getTime() === endJs.getTime()
    );
  };

  const gregMonthLabel = new Intl.DateTimeFormat(
    language === "id" ? "id-ID" : "en-US",
    { month: "long", year: "numeric" }
  ).format(new Date(gregYear, gregMonth));

  const getGregDateButtonClass = (date: Date) => {
    const baseClass =
      "w-full h-full flex items-center justify-center rounded-md text-sm transition-colors ";

    if (isGregStartOrEnd(date)) {
      return baseClass + "bg-[var(--hvsna-primary-color)] text-white";
    } else if (isGregSelected(date)) {
      return (
        baseClass +
        "bg-[var(--hvsna-primary-color-active-tab)] dark:bg-blue-900 text-white dark:text-white"
      );
    } else if (isGregToday(date)) {
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

  const handleDateClick = (date: HijriDate) => {
    if (!tempStartDate) {
      setTempStartDate(date.startOfDay());
      setTempEndDate(date.endOfDay());
    } else if (!tempEndDate || isBefore(date, tempStartDate)) {
      // Set new start date if clicking before current start, or if no end date yet
      setTempStartDate(date.startOfDay());
      setTempEndDate(date.endOfDay());
    } else {
      // Set end date
      setTempEndDate(date.endOfDay());
      if (isBefore(date, tempStartDate)) {
        // If end is before start, swap them
        setTempStartDate(date.startOfDay());
        setTempEndDate(tempStartDate.endOfDay());
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
        modal
        title={t("select_date_range")}
        onModalClose={onClose}
        rightAction={
          <NavActionButton
            variant="primary"
            onClick={handleConfirm}
            disabled={!tempStartDate || !tempEndDate}
          >
            <HvCheck />
          </NavActionButton>
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

        {/* Calendar Mode Toggle */}
        <Tabs.Root
          value={calendarMode}
          onValueChange={(value) =>
            setCalendarMode(value as "hijri" | "gregorian")
          }
          defaultValue="hijri"
        >
          <Tabs.List className="flex border-b border-gray-200 dark:border-gray-700">
            <Tabs.Tab
              value="hijri"
              className={({ active }) =>
                `flex-1 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "text-[var(--hvsna-primary-color)] border-b-2 border-[var(--hvsna-primary-color)]"
                    : "text-gray-500 dark:text-gray-400"
                }`
              }
            >
              {t("hijri")}
            </Tabs.Tab>
            <Tabs.Tab
              value="gregorian"
              className={({ active }) =>
                `flex-1 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "text-[var(--hvsna-primary-color)] border-b-2 border-[var(--hvsna-primary-color)]"
                    : "text-gray-500 dark:text-gray-400"
                }`
              }
            >
              {t("gregorian")}
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.Root>

        {/* Month Navigation */}
        <div className="flex items-center justify-between p-2">
          <button
            onClick={
              calendarMode === "hijri" ? handlePreviousMonth : handleGregPrev
            }
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            <HvChevronLeft className="w-5 h-5" />
          </button>

          <h3 className="text-m text-gray-900 dark:text-white">
            {calendarMode === "hijri"
              ? `${hijriMonthNames[currentMonth.month - 1]} ${
                  currentMonth.year
                }`
              : gregMonthLabel}
          </h3>

          <button
            onClick={
              calendarMode === "hijri" ? handleNextMonth : handleGregNext
            }
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            <HvChevronRight className="w-5 h-5" />
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
            {calendarMode === "hijri"
              ? getCalendarDays().map((date, index) => (
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
                ))
              : getGregCalendarDays().map((date, index) => (
                  <div key={index} className="aspect-3/2">
                    {date ? (
                      <button
                        onClick={() => handleGregDateClick(date)}
                        className={getGregDateButtonClass(date)}
                      >
                        {date.getDate()}
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
