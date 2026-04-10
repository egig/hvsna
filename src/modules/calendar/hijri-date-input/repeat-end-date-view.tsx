import { useState, useEffect } from "react";
import { HvChevronLeft, HvChevronRight } from "@src/modules/icons";
import { useLanguageContext } from "src/modules/i18n/LanguageContext";
import { Navbar } from "src/modules/navigation";
import { useDateTranslationHelper } from "src/modules/calendar/use-date-translation-helper";
import { useHijriDate, HijriDate } from "../hijri/use-hijri-date";
import { HijriMonth } from "../hijri/hijri-month";

interface RepeatEndDateViewProps {
  selectedDate?: string | null;
  onDateSelect: (dateStr: string) => void;
  onBack: () => void;
}

export function RepeatEndDateView({
  selectedDate = null,
  onDateSelect,
  onBack,
}: RepeatEndDateViewProps) {
  const { t } = useLanguageContext();
  const { hijriMonthNames, weekDays } = useDateTranslationHelper();
  const { createHijriDate, createHijriMonth, currentHijriMonth } =
    useHijriDate();

  // Calendar navigation state
  const [currentMonth, setCurrentMonth] = useState<HijriMonth>(
    (() => {
      if (selectedDate) {
        const year = parseInt(selectedDate.substring(0, 4));
        const month = parseInt(selectedDate.substring(4, 6));
        return createHijriMonth(year, month);
      }
      return currentHijriMonth();
    })(),
  );

  // Initialize state based on selected date
  useEffect(() => {
    if (selectedDate) {
      const year = parseInt(selectedDate.substring(0, 4));
      const month = parseInt(selectedDate.substring(4, 6));
      setCurrentMonth(createHijriMonth(year, month));
    } else {
      setCurrentMonth(currentHijriMonth());
    }
  }, [selectedDate, createHijriMonth, currentHijriMonth]);

  // Rebuild the current month object when settings change
  useEffect(() => {
    setCurrentMonth(createHijriMonth(currentMonth.year, currentMonth.month));
  }, [createHijriDate]);

  // Calendar grid
  const getCalendarDays = () => {
    const firstDay = currentMonth.getFirstDay();
    const daysInMonth = currentMonth.getDaysInMonth();
    const startDayOfWeek = firstDay.dayOfWeek;
    const days = [];
    for (let i = 0; i < startDayOfWeek; i++) days.push(null);
    for (let day = 1; day <= daysInMonth; day++)
      days.push(createHijriDate(currentMonth.year, currentMonth.month, day));
    return days;
  };

  const handlePreviousMonth = () => setCurrentMonth(currentMonth.previous());
  const handleNextMonth = () => setCurrentMonth(currentMonth.next());

  const handleDateClick = (date: HijriDate) => {
    const dateStr = `${date.year}${String(date.month).padStart(2, "0")}${String(date.day).padStart(2, "0")}`;
    onDateSelect(dateStr);
  };

  return (
    <>
      <Navbar
        title={t("repeat_ends_on_date")}
        showBackButton={true}
        customBackAction={onBack}
      />
      <div className="pb-[env(safe-area-inset-bottom)]">
        {/* Month navigation */}
        <div className="flex items-center justify-between p-2">
          <button
            onClick={handlePreviousMonth}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            <HvChevronLeft className="w-5 h-5" />
          </button>
          <h3 className="text-m text-gray-900 dark:text-white">
            {`${hijriMonthNames[currentMonth.month - 1]} ${currentMonth.year}`}
          </h3>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            <HvChevronRight className="w-5 h-5" />
          </button>
        </div>
        {/* Calendar grid */}
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
                    onClick={() => handleDateClick(date)}
                    className={`w-full h-full flex items-center justify-center rounded-md text-sm transition-colors ${
                      selectedDate ===
                      `${date.year}${String(date.month).padStart(2, "0")}${String(date.day).padStart(2, "0")}`
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
    </>
  );
}
