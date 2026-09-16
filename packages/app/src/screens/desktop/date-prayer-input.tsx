import { useState, useEffect } from "react";
import { Popover, PopoverDisclosure, usePopoverStore } from "@ariakit/react";
import { HvCalendar, HvRepeat, HvChevronRight } from "@/modules/icons";
import { CalendarMonthGrid } from "src/modules/calendar/hijri-date-input/calendar-month-grid";
import { useLanguageContext } from "src/modules/i18n/LanguageContext";
import { useCombinedDateFormat } from "src/modules/calendar/use-combined-date-format";
import type { TaskRecurringType } from "@/domain/task";
import dayjs from "dayjs";

type RecurringEnd = "never" | "on_date" | "after_occurrences";
type RepeatOption = TaskRecurringType | "custom";

interface DatePrayerInputDesktopProps {
  selectedDate: Date | null;
  isSubmitting: boolean;
  recurringType?: TaskRecurringType;
  recurringInterval?: number;
  recurringEnd?: RecurringEnd;
  recurringEndDate?: string | null;
  recurringEndOccurrences?: number;
  forceRecurring?: boolean;
  onRepeatChange?: (
    recurringType: TaskRecurringType,
    interval: number,
    recurringEnd: RecurringEnd,
    repeatEndDate: string | null,
    repeatEndOccurrences: number,
    useGregorian: boolean
  ) => void;
  useGregorian?: boolean;
  onChange: (d: Date | null) => void;
}

const REPEAT_UNITS: { value: TaskRecurringType; labelKey: string }[] = [
  { value: "daily", labelKey: "repeat_daily" },
  { value: "weekly", labelKey: "repeat_weekly" },
  { value: "monthly", labelKey: "repeat_monthly" },
  { value: "yearly", labelKey: "repeat_yearly" },
];

const INTERVAL_UNITS: { value: TaskRecurringType; labelKey: string }[] = [
  { value: "daily", labelKey: "Days" },
  { value: "weekly", labelKey: "Weeks" },
  { value: "monthly", labelKey: "Months" },
  { value: "yearly", labelKey: "Years" },
];

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

function formatEndDate(dateStr: string | null): string {
  if (!dateStr) return "";
  return dayjs(dateStr).format("DD/MM/YYYY");
}

function isSameDate(d: Date, d2: Date) {
  return (
    d2.getFullYear() === d.getFullYear() &&
    d2.getMonth() === d.getMonth() &&
    d2.getDate() === d.getDate()
  );
}

function getInitialOption(
  repeat: TaskRecurringType,
  interval: number
): RepeatOption {
  if (repeat === "none") return "none";
  if (interval === 1) return repeat;
  return "custom";
}

export default function DatePrayerInputDesktop({
  selectedDate,
  isSubmitting,
  recurringType = "none",
  recurringInterval = 1,
  recurringEnd = "never",
  recurringEndDate = null,
  recurringEndOccurrences = 1,
  forceRecurring = false,
  useGregorian = false,
  onRepeatChange,
  onChange,
}: DatePrayerInputDesktopProps) {
  const { t } = useLanguageContext();
  const { formatCombinedDate } = useCombinedDateFormat();

  const datePopover = usePopoverStore({ placement: "right-start" });
  const repeatPopover = usePopoverStore({ placement: "right-start" });
  const endDatePopover = usePopoverStore({ placement: "right-start" });

  const isRepeatOpen = repeatPopover.useState("open");
  const isEndDateOpen = endDatePopover.useState("open");

  // All temp state — committed only when the user hits Done on the date popover
  const [tempDate, setTempDate] = useState<Date | null>(selectedDate);
  const [tempRepeat, setTempRepeat] =
    useState<TaskRecurringType>(recurringType);
  const [tempRepeatInterval, setTempRepeatInterval] =
    useState(recurringInterval);
  const [tempRepeatEnd, setTempRepeatEnd] =
    useState<RecurringEnd>(recurringEnd);
  const [tempRepeatEndDate, setTempRepeatEndDate] = useState<string | null>(
    recurringEndDate
  );
  const [tempRepeatEndOccurrences, setTempRepeatEndOccurrences] = useState(
    recurringEndOccurrences
  );
  const [tempUseGregorian, setTempUseGregorian] = useState(useGregorian);

  // Repeat sub-form state (converted to temp* on repeat popover Done)
  const [selectedOption, setSelectedOption] = useState<RepeatOption>(
    getInitialOption(recurringType, recurringInterval)
  );
  const [customInterval, setCustomInterval] = useState(
    recurringInterval > 1 ? recurringInterval : 2
  );
  const [customUnit, setCustomUnit] = useState<TaskRecurringType>(
    recurringType !== "none" ? recurringType : "daily"
  );

  // Re-sync all state when date popover opens
  const isDateOpen = datePopover.useState("open");
  useEffect(() => {
    if (!isDateOpen) return;
    setTempDate(selectedDate);
    setTempRepeat(recurringType);
    setTempRepeatInterval(recurringInterval);
    setTempRepeatEnd(recurringEnd);
    setTempRepeatEndDate(recurringEndDate);
    setTempRepeatEndOccurrences(recurringEndOccurrences);
    setTempUseGregorian(useGregorian);
    setSelectedOption(getInitialOption(recurringType, recurringInterval));
    setCustomInterval(recurringInterval > 1 ? recurringInterval : 2);
    setCustomUnit(recurringType !== "none" ? recurringType : "daily");
  }, [isDateOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-sync repeat sub-form when repeat popover opens (picks up latest temp state)
  useEffect(() => {
    if (!isRepeatOpen) return;
    setSelectedOption(getInitialOption(tempRepeat, tempRepeatInterval));
    setCustomInterval(tempRepeatInterval > 1 ? tempRepeatInterval : 2);
    setCustomUnit(tempRepeat !== "none" ? tempRepeat : "daily");
  }, [isRepeatOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const formatDateLabel = () => {
    if (!selectedDate) return t("no_date");
    if (isSameDate(selectedDate, new Date())) return t("today");
    if (isSameDate(selectedDate, dayjs().add(1, "day").toDate()))
      return t("tomorrow");
    return formatCombinedDate(selectedDate);
  };

  const repeatLabel =
    tempRepeat !== "none"
      ? formatRepeatLabel(tempRepeat, tempRepeatInterval, t)
      : t("repeat");

  // ── Confirm handlers ───────────────────────────────────────────────────────

  const handleConfirm = () => {
    onChange(tempDate);
    if (onRepeatChange) {
      onRepeatChange(
        tempRepeat,
        tempRepeatInterval,
        tempRepeatEnd,
        tempRepeatEndDate,
        tempRepeatEndOccurrences,
        tempUseGregorian
      );
    }
    datePopover.hide();
  };

  const handleConfirmRepeat = () => {
    if (selectedOption === "none") {
      setTempRepeat("none");
      setTempRepeatInterval(1);
      setTempRepeatEnd("never");
      setTempRepeatEndDate(null);
      setTempRepeatEndOccurrences(1);
      setTempUseGregorian(false);
    } else if (selectedOption === "custom") {
      setTempRepeat(customUnit);
      setTempRepeatInterval(Math.max(1, customInterval));
    } else {
      setTempRepeat(selectedOption as TaskRecurringType);
      setTempRepeatInterval(1);
    }
    repeatPopover.hide();
  };

  // ── Quick shortcuts ─────────────────────────────────────────────────────────

  const confirmQuick = (date: Date | null, reset = false) => {
    onChange(date);
    if (onRepeatChange) {
      if (reset) {
        onRepeatChange("none", 1, "never", null, 1, false);
      } else {
        onRepeatChange(
          tempRepeat,
          tempRepeatInterval,
          tempRepeatEnd,
          tempRepeatEndDate,
          tempRepeatEndOccurrences,
          tempUseGregorian
        );
      }
    }
    datePopover.hide();
  };

  const handleToday = () => confirmQuick(dayjs().endOf("day").toDate());
  const handleTomorrow = () =>
    confirmQuick(dayjs().add(1, "day").endOf("day").toDate());
  const handleNextWeek = () => {
    const dayOfWeek = dayjs().day();
    const daysUntilFriday = (5 - dayOfWeek + 7) % 7 || 7;
    confirmQuick(dayjs().add(daysUntilFriday, "day").endOf("day").toDate());
  };
  const handleNoDate = () => confirmQuick(null, true);

  // ── Shared button classes ───────────────────────────────────────────────────

  const optionBtn =
    "w-full px-3 py-2 rounded-lg border text-sm transition-colors text-left";
  const activeOpt =
    "bg-[var(--hvsna-primary-color)] text-white border-[var(--hvsna-primary-color)]";
  const inactiveOpt =
    "bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600";

  const endBtn =
    "flex-1 px-2 py-1.5 rounded-lg border text-xs font-medium transition-colors";
  const activeEnd =
    "bg-[var(--hvsna-primary-color)] text-white border-[var(--hvsna-primary-color)]";
  const inactiveEnd =
    "bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600";

  const popoverBase =
    "bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700";

  // ── Trigger button ──────────────────────────────────────────────────────────

  const triggerButton = (
    <button
      type="button"
      disabled={isSubmitting}
      data-testid="date-prayer-input-button"
      className={`h-[38px] px-3 border rounded-lg flex items-center gap-2 text-sm transition-colors border-gray-300 dark:border-gray-600 ${
        selectedDate
          ? "text-gray-900 dark:text-white"
          : "text-gray-500 dark:text-gray-400"
      } ${
        isSubmitting
          ? "opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-600"
          : "bg-white dark:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 cursor-pointer"
      }`}
    >
      {recurringType !== "none" ? (
        <HvRepeat className="w-4 h-4 text-[var(--hvsna-primary-color)] flex-shrink-0" />
      ) : (
        <HvCalendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
      )}
      <span>{formatDateLabel()}</span>
    </button>
  );

  return (
    <>
      <PopoverDisclosure store={datePopover} render={triggerButton} />

      {/* ── Date popover ──────────────────────────────────────────────────── */}
      <Popover
        store={datePopover}
        portal
        gutter={8}
        hideOnInteractOutside={!isRepeatOpen && !isEndDateOpen}
        className={`z-[10001] w-[320px] ${popoverBase}`}
      >
        {/* Quick shortcuts */}
        <div className="flex flex-wrap gap-1.5 p-3 border-b border-gray-100 dark:border-gray-700">
          <button
            type="button"
            onClick={handleToday}
            className="px-2.5 py-1 text-xs rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors"
          >
            {t("today")}
          </button>
          <button
            type="button"
            onClick={handleTomorrow}
            className="px-2.5 py-1 text-xs rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors"
          >
            {t("tomorrow")}
          </button>
          <button
            type="button"
            onClick={handleNextWeek}
            className="px-2.5 py-1 text-xs rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors"
          >
            {t("next_week")}
          </button>
        </div>

        {/* Calendar */}
        <CalendarMonthGrid
          isOpen={isDateOpen}
          selectedDate={tempDate ? dayjs(tempDate).format("YYYY-MM-DD") : ""}
          onChange={(dateStr) =>
            setTempDate(dayjs(dateStr).endOf("day").toDate())
          }
        />

        {/* Repeat row — also the disclosure for the repeat popover */}
        <div className="border-t border-gray-100 dark:border-gray-700">
          <PopoverDisclosure
            store={repeatPopover}
            render={
              <button
                type="button"
                disabled={!tempDate}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <HvRepeat
                  className={`w-4 h-4 flex-shrink-0 ${
                    tempRepeat !== "none"
                      ? "text-[var(--hvsna-primary-color)]"
                      : "text-gray-400"
                  }`}
                />
                <span
                  className={`flex-1 text-left ${
                    tempRepeat !== "none"
                      ? "text-[var(--hvsna-primary-color)]"
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {repeatLabel}
                </span>
                <HvChevronRight className="w-3 h-3 text-gray-400" />
              </button>
            }
          />
        </div>

        {/* Remove date + Done */}
        <div className="flex items-center justify-between p-2 border-t border-gray-100 dark:border-gray-700">
          {selectedDate && (
            <button
              type="button"
              onClick={handleNoDate}
              className="text-xs text-[var(--hvsna-danger-color)] hover:text-[var(--hvsna-danger-color-hover)] px-1 py-1 transition-colors"
              data-testid="remove-date-button"
            >
              {t("remove_date")}
            </button>
          )}
          <button
            type="button"
            disabled={!tempDate}
            onClick={handleConfirm}
            className="ml-auto px-4 py-1.5 text-sm bg-[var(--hvsna-primary-color)] hover:bg-[var(--hvsna-primary-color-hover)] active:bg-[var(--hvsna-primary-color-pressed)] text-white rounded-md disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {t("done") || "Done"}
          </button>
        </div>
      </Popover>

      {/* ── Repeat popover ────────────────────────────────────────────────── */}
      <Popover
        store={repeatPopover}
        portal
        gutter={8}
        hideOnInteractOutside={!isEndDateOpen}
        className={`z-[10002] w-[268px] ${popoverBase}`}
      >
        <div className="px-3 py-2.5 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            {t("repeat")}
          </h3>
        </div>

        <div className="p-3 flex flex-col gap-1.5">
          {REPEAT_UNITS.map(({ value, labelKey }) => (
            <button
              key={value}
              type="button"
              onClick={() => setSelectedOption(value)}
              className={`${optionBtn} ${
                selectedOption === value ? activeOpt : inactiveOpt
              }`}
            >
              {t(labelKey)}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setSelectedOption("custom")}
            className={`${optionBtn} ${
              selectedOption === "custom" ? activeOpt : inactiveOpt
            }`}
          >
            {t("repeat_custom") || "Custom"}
          </button>

          {selectedOption === "custom" && (
            <div className="flex gap-2 mt-1">
              <select
                value={customInterval}
                onChange={(e) =>
                  setCustomInterval(Math.max(2, parseInt(e.target.value) || 2))
                }
                className="w-16 px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-center text-sm focus:outline-none dark:bg-gray-700 dark:text-white"
              >
                {Array.from({ length: 998 }, (_, k) => k + 2).map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
              <select
                value={customUnit}
                onChange={(e) =>
                  setCustomUnit(e.target.value as TaskRecurringType)
                }
                className="flex-1 px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none dark:bg-gray-700 dark:text-white"
              >
                {INTERVAL_UNITS.map(({ value, labelKey }) => (
                  <option key={value} value={value}>
                    {t(labelKey)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Ends section */}
          <div
            className={`mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 ${
              selectedOption === "none" ? "opacity-50" : ""
            }`}
          >
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
              {t("repeat_ends")}
            </div>
            <div className="flex gap-1.5">
              <button
                type="button"
                disabled={selectedOption === "none"}
                onClick={() =>
                  selectedOption !== "none" && setTempRepeatEnd("never")
                }
                className={`${endBtn} ${
                  tempRepeatEnd === "never" ? activeEnd : inactiveEnd
                } disabled:cursor-not-allowed`}
              >
                {t("repeat_ends_never")}
              </button>

              {/* "On date" — opens end-date popover */}
              <PopoverDisclosure
                store={endDatePopover}
                disabled={selectedOption === "none"}
                render={
                  <button
                    type="button"
                    onClick={() =>
                      selectedOption !== "none" && setTempRepeatEnd("on_date")
                    }
                    className={`${endBtn} ${
                      tempRepeatEnd === "on_date" ? activeEnd : inactiveEnd
                    } disabled:cursor-not-allowed`}
                  >
                    {tempRepeatEndDate
                      ? formatEndDate(tempRepeatEndDate)
                      : t("repeat_ends_on_date")}
                  </button>
                }
              />

              <button
                type="button"
                disabled={selectedOption === "none"}
                onClick={() =>
                  selectedOption !== "none" &&
                  setTempRepeatEnd("after_occurrences")
                }
                className={`${endBtn} ${
                  tempRepeatEnd === "after_occurrences"
                    ? activeEnd
                    : inactiveEnd
                } disabled:cursor-not-allowed`}
              >
                {t("repeat_ends_after")}
              </button>
            </div>

            {tempRepeatEnd === "after_occurrences" && (
              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  disabled={
                    selectedOption === "none" || tempRepeatEndOccurrences <= 1
                  }
                  onClick={() =>
                    setTempRepeatEndOccurrences(
                      Math.max(1, tempRepeatEndOccurrences - 1)
                    )
                  }
                  className="w-7 h-7 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 flex items-center justify-center text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  -
                </button>
                <span className="w-10 text-center text-sm font-medium text-gray-900 dark:text-white">
                  {tempRepeatEndOccurrences}
                </span>
                <button
                  type="button"
                  disabled={selectedOption === "none"}
                  onClick={() =>
                    setTempRepeatEndOccurrences(tempRepeatEndOccurrences + 1)
                  }
                  className="w-7 h-7 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 flex items-center justify-center text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  +
                </button>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {t("occurrences")}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100 dark:border-gray-700">
          {!forceRecurring && (
            <button
              type="button"
              onClick={() => {
                setSelectedOption("none");
                setTempRepeatEnd("never");
                setTempRepeatEndOccurrences(1);
              }}
              className="text-xs text-[var(--hvsna-danger-color)] hover:text-[var(--hvsna-danger-color-hover)] px-1 py-1 transition-colors"
            >
              {t("no_repeat")}
            </button>
          )}
          <button
            type="button"
            onClick={handleConfirmRepeat}
            className="ml-auto px-4 py-1.5 text-sm bg-[var(--hvsna-primary-color)] hover:bg-[var(--hvsna-primary-color-hover)] active:bg-[var(--hvsna-primary-color-pressed)] text-white rounded-md transition-colors"
          >
            {t("done") || "Done"}
          </button>
        </div>
      </Popover>

      {/* ── End-date popover ──────────────────────────────────────────────── */}
      <Popover
        store={endDatePopover}
        portal
        gutter={8}
        className={`z-[10003] w-[320px] ${popoverBase}`}
      >
        <div className="px-3 py-2.5 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            {t("repeat_ends_on_date")}
          </h3>
        </div>
        <CalendarMonthGrid
          selectedDate={tempRepeatEndDate}
          onChange={(dateStr) => {
            setTempRepeatEnd("on_date");
            setTempRepeatEndDate(dateStr);
            endDatePopover.hide();
          }}
        />
      </Popover>
    </>
  );
}
