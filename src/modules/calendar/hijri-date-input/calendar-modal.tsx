import { useState, useEffect } from "react";
import { Check, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Modal, Navbar } from "src/modules/navigation";
import { Tabs } from "@base-ui/react/tabs";
import { HijriMonth } from "../hijri/hijri-month";
import { useDateTranslationHelper } from "src/modules/calendar/use-date-translation-helper";
import { ListInput } from "src/modules/components/list-input";
import { useFeatureFlag } from "src/modules/feature-flags/useFeatureFlags";
import { useLanguageContext } from "../../i18n/LanguageContext";
import { useHijriDate, HijriDate } from "../hijri/use-hijri-date";

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: HijriDate | null;
  onDateSelect: (date: HijriDate | null) => void;
}

export function CalendarModal({
  isOpen,
  onClose,
  selectedDate,
  onDateSelect,
}: CalendarModalProps) {
  const { t, language } = useLanguageContext();
  const { hijriMonthNames, weekDays } = useDateTranslationHelper();
  const {
    getToday,
    createHijriDate,
    createHijriMonth,
    currentHijriMonth,
    toHijriDate,
  } = useHijriDate();

  const [currentMonth, setCurrentMonth] = useState<HijriMonth>(
    selectedDate
      ? createHijriMonth(selectedDate.year, selectedDate.month)
      : currentHijriMonth(),
  );
  const [tempSelectedDate, setTempSelectedDate] = useState<HijriDate | null>(
    selectedDate,
  );
  const repeatEnabled = useFeatureFlag("TASK_REPEAT");
  const [editMode, setEditMode] = useState<"date" | "repeat">("date");
  const [calendarMode, setCalendarMode] = useState<"hijri" | "gregorian">(
    "hijri",
  );
  const [gregYear, setGregYear] = useState(() => new Date().getFullYear());
  const [gregMonth, setGregMonth] = useState(() => new Date().getMonth());

  useEffect(() => {
    if (selectedDate) {
      setCurrentMonth(createHijriMonth(selectedDate.year, selectedDate.month));
      setTempSelectedDate(selectedDate);
    }
  }, [selectedDate, createHijriMonth]);

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

  // Update current month when settings change
  useEffect(() => {
    setCurrentMonth(createHijriMonth(currentMonth.year, currentMonth.month));
  }, [createHijriDate]);

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
    setTempSelectedDate(toHijriDate(date));
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
    if (!tempSelectedDate) return false;
    const js = tempSelectedDate.toDate();
    return (
      date.getFullYear() === js.getFullYear() &&
      date.getMonth() === js.getMonth() &&
      date.getDate() === js.getDate()
    );
  };

  const gregMonthLabel = new Intl.DateTimeFormat(
    language === "id" ? "id-ID" : "en-US",
    { month: "long", year: "numeric" },
  ).format(new Date(gregYear, gregMonth));

  const handleDateClick = (date: HijriDate) => {
    setTempSelectedDate(date);
  };

  const handleConfirm = () => {
    if (tempSelectedDate) {
      const finalDate = createHijriDate(
        tempSelectedDate.year,
        tempSelectedDate.month,
        tempSelectedDate.day,
      );
      onDateSelect(finalDate);
      onClose();
    }
  };

  const handleTomorrow = () => {
    const h = getToday();
    onDateSelect(h.next().startOfDay());
    onClose();
  };

  const handleToday = () => {
    const today = getToday().startOfDay();
    onDateSelect(today);
    onClose();
  };

  const handleNextWeek = () => {
    const today = getToday();
    const dayOfWeek = today.toDate().getDay(); // 0=Sun, 5=Fri
    const daysUntilFriday = (5 - dayOfWeek + 7) % 7 || 7;
    let date = today;
    for (let i = 0; i < daysUntilFriday; i++) {
      date = date.next();
    }
    onDateSelect(date.startOfDay());
    onClose();
  };

  const handleNoDate = () => {
    onDateSelect(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      {editMode === "date" && (
        <>
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
          <div className="flex flex-col">
            <ListInput onClick={handleToday} label={t("today")} />
            <ListInput onClick={handleTomorrow} label={t("tomorrow")} />
            <ListInput onClick={handleNextWeek} label={t("next_week")} />
            <ListInput onClick={handleNoDate} label={t("no_date")} />
          </div>
          <div className="pb-[env(safe-area-inset-bottom)]">
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
                  calendarMode === "hijri"
                    ? handlePreviousMonth
                    : handleGregPrev
                }
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                <ChevronLeftIcon className="w-5 h-5" />
              </button>

              <h3 className="text-m text-gray-900 dark:text-white">
                {calendarMode === "hijri"
                  ? `${hijriMonthNames[currentMonth.month - 1]} ${currentMonth.year}`
                  : gregMonthLabel}
              </h3>

              <button
                onClick={
                  calendarMode === "hijri" ? handleNextMonth : handleGregNext
                }
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                <ChevronRightIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Calendar Grid */}
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
                {calendarMode === "hijri"
                  ? getCalendarDays().map((date, index) => (
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
                    ))
                  : getGregCalendarDays().map((date, index) => (
                      <div key={index} className="aspect-3/2">
                        {date ? (
                          <button
                            onClick={() => handleGregDateClick(date)}
                            className={`w-full h-full flex items-center justify-center rounded-md text-sm transition-colors ${
                              isGregSelected(date)
                                ? "bg-[var(--hvsna-primary-color)] text-white"
                                : isGregToday(date)
                                  ? "bg-[var(--hvsna-primary-color-active-tab)] dark:bg-blue-900 text-white dark:text-white"
                                  : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                            }`}
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

            {repeatEnabled && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("repeat")}
                </label>
                <select
                  name="repeat"
                  defaultValue={"none"}
                  disabled={false}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="none">{t("no_repeat")}</option>
                  <option value="daily">
                    {t("daily_at_time", { time: "" })}
                  </option>
                  <option value="monthly">
                    {t("monthly_on_day", { day: tempSelectedDate?.day || 1 })}
                  </option>
                  <option value="yearly">
                    {t("yearly_on_day_month", {
                      day: tempSelectedDate?.day || 1,
                      month:
                        hijriMonthNames[(tempSelectedDate?.month || 1) - 1],
                    })}
                  </option>
                </select>
              </div>
            )}
          </div>
        </>
      )}
    </Modal>
  );
}
