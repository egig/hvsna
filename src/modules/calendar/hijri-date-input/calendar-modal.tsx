import { useState, useEffect } from "react";
import { Activity } from "react";
import {
  HvCheck,
  HvChevronLeft,
  HvChevronRight,
  HvRepeat,
} from "@/modules/icons";
import { Modal, ModalNavbar } from "src/modules/navigation";
import { NavActionButton } from "../../components/nav-action-button";
import { Tabs } from "@base-ui/react/tabs";
import { HijriMonth } from "../hijri/hijri-month";
import { useDateTranslationHelper } from "src/modules/calendar/use-date-translation-helper";
import { ListInput } from "src/modules/components/list-input";
import { useLanguageContext } from "../../i18n/LanguageContext";
import { useHijriDate, HijriDate } from "../hijri/use-hijri-date";
import type { TaskRecurringType } from "@/domain/task";
import { RepeatSelectorModal } from "src/modules/task/repeat-selector-modal";
import { RepeatEndDateView } from "./repeat-end-date-view";

type RepeatEnd = "never" | "on_date" | "after_occurrences";

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: HijriDate | null;
  selectedRecurringType?: TaskRecurringType;
  selectedRecurringInterval?: number;
  selectedRecurringEnd?: RepeatEnd;
  selectedRecurringEndDate?: string | null;
  selectedRecurringEndOccurrences?: number;
  selectedUseGregorian?: boolean;
  forceRecurring?: boolean; // If true, repeat is forced to be selected (no "none" option)
  onConfirm: (
    date: HijriDate | null,
    recurring: TaskRecurringType,
    recurringInterval: number,
    recurringEnd: RepeatEnd,
    recurringEndDate: string | null,
    recurringEndOccurrences: number,
    useGregorian: boolean
  ) => void;
}

function formatRepeatLabel(
  recurringType: TaskRecurringType,
  interval: number,
  t: (key: string) => string
): string {
  const unitLabels: Record<string, string> = {
    daily: t("repeat_daily"),
    weekly: t("repeat_weekly"),
    monthly: t("repeat_monthly"),
    yearly: t("repeat_yearly"),
  };
  if (interval <= 1) return unitLabels[recurringType] ?? recurringType;
  return `${t("every") || "Every"} ${interval} ${(
    unitLabels[recurringType] ?? recurringType
  ).toLowerCase()}`;
}

export function CalendarModal({
  isOpen,
  onClose,
  selectedDate,
  selectedRecurringType: selectedRecurringType = "none",
  selectedRecurringInterval: selectedRecurringInterval = 1,
  selectedRecurringEnd: selectedRecurringEnd = "never",
  selectedRecurringEndDate: selectedRecurringEndDate = null,
  selectedRecurringEndOccurrences: selectedRecurringEndOccurrences = 1,
  selectedUseGregorian = false,
  forceRecurring: forceRecurring = false,
  onConfirm,
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

  // Which sub-view is active inside the modal
  const [view, setView] = useState<
    "date" | "time" | "repeat" | "repeat_end_date"
  >("date");

  // Calendar navigation state
  const [currentMonth, setCurrentMonth] = useState<HijriMonth>(
    selectedDate
      ? createHijriMonth(selectedDate.year, selectedDate.month)
      : currentHijriMonth()
  );
  const [calendarMode, setCalendarMode] = useState<"hijri" | "gregorian">(
    "hijri"
  );
  const [gregYear, setGregYear] = useState(() => new Date().getFullYear());
  const [gregMonth, setGregMonth] = useState(() => new Date().getMonth());

  // Pending selections — committed only when the user taps the confirm button
  const [tempSelectedDate, setTempSelectedDate] = useState<HijriDate | null>(
    selectedDate
  );
  const [tempRepeat, setTempRepeat] = useState<TaskRecurringType>(
    selectedRecurringType ?? "none"
  );
  const [tempRepeatInterval, setTempRepeatInterval] = useState(
    selectedRecurringInterval ?? 1
  );
  const [tempRepeatEnd, setTempRepeatEnd] = useState<RepeatEnd>(
    selectedRecurringEnd ?? "never"
  );
  const [tempRepeatEndDate, setTempRepeatEndDate] = useState<string | null>(
    selectedRecurringEndDate ?? null
  );
  const [tempRepeatEndOccurrences, setTempRepeatEndOccurrences] = useState(
    selectedRecurringEndOccurrences ?? 1
  );
  const [tempUseGregorian, setTempUseGregorian] = useState(
    selectedUseGregorian ?? false
  );

  // Re-sync pending state whenever the modal opens (props may have changed)
  useEffect(() => {
    if (!isOpen) return;
    setView("date");
    setTempSelectedDate(selectedDate);
    setTempRepeat(selectedRecurringType ?? "none");
    setTempRepeatInterval(selectedRecurringInterval ?? 1);
    setTempRepeatEnd(selectedRecurringEnd ?? "never");
    setTempRepeatEndDate(selectedRecurringEndDate ?? null);
    setTempRepeatEndOccurrences(selectedRecurringEndOccurrences ?? 1);
    setTempUseGregorian(selectedUseGregorian ?? false);
    setCurrentMonth(
      selectedDate
        ? createHijriMonth(selectedDate.year, selectedDate.month)
        : currentHijriMonth()
    );
  }, [isOpen]);

  // Rebuild the current month object when settings (e.g. manual date offset) change
  useEffect(() => {
    setCurrentMonth(createHijriMonth(currentMonth.year, currentMonth.month));
  }, [createHijriDate]);

  // ── Hijri calendar grid ────────────────────────────────────────────────────

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

  // ── Gregorian calendar grid ────────────────────────────────────────────────

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
    { month: "long", year: "numeric" }
  ).format(new Date(gregYear, gregMonth));

  // ── Navigation ─────────────────────────────────────────────────────────────

  const handlePreviousMonth = () => setCurrentMonth(currentMonth.previous());
  const handleNextMonth = () => setCurrentMonth(currentMonth.next());

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

  // ── Confirm / quick-select handlers ───────────────────────────────────────

  const handleConfirm = () => {
    if (tempSelectedDate) {
      const finalDate = createHijriDate(
        tempSelectedDate.year,
        tempSelectedDate.month,
        tempSelectedDate.day
      );
      onConfirm(
        finalDate,
        tempRepeat,
        tempRepeatInterval,
        tempRepeatEnd,
        tempRepeatEndDate,
        tempRepeatEndOccurrences,
        tempUseGregorian
      );
    }
  };

  const isSelectedToday = () => {
    if (!selectedDate) return false;
    const today = getToday().startOfDay();
    return (
      selectedDate.year === today.year &&
      selectedDate.month === today.month &&
      selectedDate.day === today.day
    );
  };

  const isSelectedTomorrow = () => {
    if (!selectedDate) return false;
    const tomorrow = getToday().next().startOfDay();
    return (
      selectedDate.year === tomorrow.year &&
      selectedDate.month === tomorrow.month &&
      selectedDate.day === tomorrow.day
    );
  };

  const isSelectedNextWeek = () => {
    if (!selectedDate) return false;
    const today = getToday();
    const dayOfWeek = today.toDate().getDay(); // 0=Sun ... 5=Fri
    const daysUntilFriday = (5 - dayOfWeek + 7) % 7 || 7;

    // Create next Friday by adding days using next() method
    let nextFriday = today;
    for (let i = 0; i < daysUntilFriday; i++) {
      nextFriday = nextFriday.next();
    }
    nextFriday = nextFriday.startOfDay();

    return (
      selectedDate.year === nextFriday.year &&
      selectedDate.month === nextFriday.month &&
      selectedDate.day === nextFriday.day
    );
  };

  const isSelectedNoDate = () => {
    return selectedDate === null;
  };

  const handleToday = () => {
    const today = getToday().startOfDay();
    onConfirm(
      today,
      tempRepeat,
      tempRepeatInterval,
      tempRepeatEnd,
      tempRepeatEndDate,
      tempRepeatEndOccurrences,
      tempUseGregorian
    );
  };

  const handleTomorrow = () => {
    const tomorrow = getToday().next().startOfDay();
    onConfirm(
      tomorrow,
      tempRepeat,
      tempRepeatInterval,
      tempRepeatEnd,
      tempRepeatEndDate,
      tempRepeatEndOccurrences,
      tempUseGregorian
    );
  };

  const handleNextWeek = () => {
    const today = getToday();
    const dayOfWeek = today.toDate().getDay(); // 0=Sun … 5=Fri
    const daysUntilFriday = (5 - dayOfWeek + 7) % 7 || 7;
    let date = today;
    for (let i = 0; i < daysUntilFriday; i++) date = date.next();
    onConfirm(
      date.startOfDay(),
      tempRepeat,
      tempRepeatInterval,
      tempRepeatEnd,
      tempRepeatEndDate,
      tempRepeatEndOccurrences,
      tempUseGregorian
    );
  };

  const handleNoDate = () => {
    onConfirm(null, "none", 1, "never", null, 1, false);
  };

  const repeatLabel =
    tempRepeat !== "none"
      ? formatRepeatLabel(tempRepeat, tempRepeatInterval, t)
      : t("repeat");

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      {/* ── Date view ─────────────────────────────────────────────────────── */}
      <Activity mode={view === "date" ? "visible" : "hidden"}>
        <>
          <ModalNavbar
            title={t("select_date")}
            onModalClose={onClose}
            rightAction={
              <NavActionButton
                variant="primary"
                onClick={handleConfirm}
                disabled={!tempSelectedDate}
                data-testid="calendar-confirm-button"
              >
                <HvCheck />
              </NavActionButton>
            }
          />

          {/* Quick date shortcuts */}
          <div className="flex flex-col">
            {!isSelectedToday() && (
              <ListInput onClick={handleToday} label={t("today")} />
            )}
            {!isSelectedTomorrow() && (
              <ListInput onClick={handleTomorrow} label={t("tomorrow")} />
            )}
            {!isSelectedNextWeek() && (
              <ListInput onClick={handleNextWeek} label={t("next_week")} />
            )}
            {!isSelectedNoDate() && (
              <ListInput onClick={handleNoDate} label={t("no_date")} />
            )}
          </div>

          <div className="pb-[env(safe-area-inset-bottom)]">
            {/* Calendar mode tabs */}
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

            {/* Month navigation */}
            <div className="flex items-center justify-between p-2">
              <button
                onClick={
                  calendarMode === "hijri"
                    ? handlePreviousMonth
                    : handleGregPrev
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
                {calendarMode === "hijri"
                  ? getCalendarDays().map((date, index) => (
                      <div key={index} className="aspect-3/2">
                        {date ? (
                          <button
                            onClick={() => setTempSelectedDate(date)}
                            data-testid={
                              date.isToday()
                                ? "calendar-today-button"
                                : undefined
                            }
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
                            onClick={() =>
                              setTempSelectedDate(toHijriDate(date))
                            }
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

            <div className="flex flex-col">
              <ListInput
                onClick={() => setView("repeat")}
                label={repeatLabel}
                icon={<HvRepeat className="w-4 h-4" />}
                disabled={!tempSelectedDate}
                testId="repeat-list-button"
              />
            </div>
          </div>
        </>
      </Activity>

      {/* ── Repeat sub-view ───────────────────────────────────────────────── */}
      <Activity mode={view === "repeat" ? "visible" : "hidden"}>
        <RepeatSelectorModal
          recurringType={tempRepeat}
          interval={tempRepeatInterval}
          recurringEnd={tempRepeatEnd}
          recurringEndDate={tempRepeatEndDate}
          recurringEndOccurrences={tempRepeatEndOccurrences}
          forceRecurring={forceRecurring}
          onBack={() => setView("date")}
          onSelectEndDate={() => setView("repeat_end_date")}
          onConfirm={(
            repeat,
            interval,
            repeatEnd,
            endDate,
            endOccurrences,
            gregorian
          ) => {
            setTempRepeat(repeat);
            setTempRepeatInterval(interval);
            setTempRepeatEnd(repeatEnd);
            setTempRepeatEndDate(endDate);
            setTempRepeatEndOccurrences(endOccurrences);
            setTempUseGregorian(gregorian);
            setView("date");
          }}
          useGregorian={tempUseGregorian}
        />
      </Activity>

      {/* ── Repeat end date sub-view ──────────────────────────────────────── */}
      <Activity mode={view === "repeat_end_date" ? "visible" : "hidden"}>
        <RepeatEndDateView
          selectedDate={tempRepeatEndDate}
          onDateSelect={(dateStr) => {
            setTempRepeatEnd("on_date");
            setTempRepeatEndDate(dateStr);
            setView("repeat");
          }}
          onBack={() => setView("repeat")}
        />
      </Activity>
    </Modal>
  );
}
