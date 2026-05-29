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
import { useDateTranslationHelper } from "src/modules/calendar/use-date-translation-helper";
import { ListInput } from "src/modules/components/list-input";
import { useLanguageContext } from "../../i18n/LanguageContext";
import { useHijriDate } from "../hijri/use-hijri-date";
import type { TaskRecurringType } from "@/domain/task";
import { RepeatSelectorModal } from "src/modules/task/repeat-selector-modal";
import { RepeatEndDateView } from "./repeat-end-date-view";
import dayjs from "dayjs";

type RepeatEnd = "never" | "on_date" | "after_occurrences";

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  selectedRecurringType?: TaskRecurringType;
  selectedRecurringInterval?: number;
  selectedRecurringEnd?: RepeatEnd;
  selectedRecurringEndDate?: string | null;
  selectedRecurringEndOccurrences?: number;
  selectedUseGregorian?: boolean;
  forceRecurring?: boolean; // If true, repeat is forced to be selected (no "none" option)
  onConfirm: (
    date: Date | null,
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
  const { weekDays } = useDateTranslationHelper();
  const { toHijriDate } = useHijriDate();

  // Which sub-view is active inside the modal
  const [view, setView] = useState<
    "date" | "time" | "repeat" | "repeat_end_date"
  >("date");

  const [gregYear, setGregYear] = useState(() => new Date().getFullYear());
  const [gregMonth, setGregMonth] = useState(() =>
    (selectedDate || new Date()).getMonth()
  );

  // Pending selections — committed only when the user taps the confirm button
  const [tempSelectedDate, setTempSelectedDate] = useState<Date | null>(
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
    setGregYear(
      selectedDate ? selectedDate.getFullYear() : new Date().getFullYear()
    );
    setGregMonth(
      selectedDate ? selectedDate.getMonth() : new Date().getMonth()
    );
  }, [isOpen]);

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
    const js = tempSelectedDate;
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
      onConfirm(
        tempSelectedDate,
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
    const today = new Date();
    return (
      selectedDate.getFullYear() === today.getFullYear() &&
      selectedDate.getMonth() === today.getMonth() &&
      selectedDate.getDate() === today.getDate()
    );
  };

  const isSelectedTomorrow = () => {
    if (!selectedDate) return false;
    const tomorrow = dayjs().add(1, "day").toDate();
    return (
      selectedDate.getFullYear() === tomorrow.getFullYear() &&
      selectedDate.getMonth() === tomorrow.getMonth() &&
      selectedDate.getDate() === tomorrow.getDate()
    );
  };

  const isSelectedNextWeek = () => {
    if (!selectedDate) return false;
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sun ... 5=Fri
    const daysUntilFriday = (5 - dayOfWeek + 7) % 7 || 7;

    // Create next Friday by adding days using next() method
    let nextFriday = today;
    for (let i = 0; i < daysUntilFriday; i++) {
      nextFriday = dayjs(nextFriday).add(1, "day").toDate();
    }

    return (
      selectedDate.getFullYear() === nextFriday.getFullYear() &&
      selectedDate.getMonth() === nextFriday.getMonth() &&
      selectedDate.getDate() === nextFriday.getDate()
    );
  };

  const isSelectedNoDate = () => {
    return selectedDate === null;
  };

  const handleToday = () => {
    const today = new Date();
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
    const tomorrow = dayjs().add(1, "day").toDate();
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
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sun … 5=Fri
    const daysUntilFriday = (5 - dayOfWeek + 7) % 7 || 7;
    let date = today;
    for (let i = 0; i < daysUntilFriday; i++)
      date = dayjs(date).add(1, "day").toDate();
    onConfirm(
      date,
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
            <div className="flex items-center justify-between p-2 gap-2">
              <button
                onClick={handleGregPrev}
                className="p-2 bg-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                <HvChevronLeft className="w-5 h-5" />
              </button>

              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                {gregMonthLabel}
              </h3>

              <button
                onClick={handleGregNext}
                className="p-2  bg-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
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
                {getGregCalendarDays().map((date, index) => (
                  <div key={index} className="aspect-3/2">
                    {date ? (
                      <button
                        onClick={() => setTempSelectedDate(date)}
                        className={`w-full flex flex-col py-1 px-2 items-center justify-center rounded-md text-sm transition-colors ${
                          isGregSelected(date)
                            ? "bg-[var(--hvsna-primary-color)] text-white"
                            : isGregToday(date)
                            ? "bg-[var(--hvsna-primary-color-active-tab)] dark:bg-blue-900 text-white dark:text-white"
                            : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                        }`}
                      >
                        <div className="text-base">{date.getDate()}</div>
                        <div className="text-[0.625rem]">
                          {toHijriDate(date).day}
                        </div>
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
