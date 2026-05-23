import { useState } from "react";
import { HvCalendar, HvRepeat } from "@/modules/icons";
import { CalendarModal } from "src/modules/calendar/hijri-date-input/calendar-modal";
import { useHijriDate } from "src/modules/calendar/hijri";
import { useLanguageContext } from "src/modules/i18n/LanguageContext";
import type { HijriDate } from "src/modules/calendar/hijri/hijri-date";
import type { PrayerTime, TaskRecurringType } from "@/domain/task";

type RecurringEnd = "never" | "on_date" | "after_occurrences";

interface DatePrayerInputProps {
  hijriDate: HijriDate | null;
  isSubmitting: boolean;
  recurringType?: TaskRecurringType;
  recurringInterval?: number;
  recurringEnd?: RecurringEnd;
  recurringEndDate?: string | null;
  recurringEndOccurrences?: number;
  forceRecurring?: boolean; // If true, repeat is forced to be selected (no "none" option)
  onRepeatChange?: (
    recurringType: TaskRecurringType,
    interval: number,
    recurringEnd: RecurringEnd,
    repeatEndDate: string | null,
    repeatEndOccurrences: number,
    useGregorian: boolean
  ) => void;
  useGregorian?: boolean;
  onChange: (hijriDate: HijriDate | null) => void;
}

export function DatePrayerInput({
  hijriDate,
  isSubmitting,
  recurringType: recurringType = "none",
  recurringInterval: recurringInterval = 1,
  recurringEnd: recurringEnd = "never",
  recurringEndDate: recurringEndDate = null,
  recurringEndOccurrences: recurringEndOccurrences = 1,
  forceRecurring: forceRepeat = false,
  useGregorian = false,
  onRepeatChange,
  onChange,
}: DatePrayerInputProps) {
  const { t } = useLanguageContext();
  const { isToday, isTomorrow, formatDate } = useHijriDate();
  const [isOpen, setIsOpen] = useState(false);

  const formatDateLabel = () => {
    if (!hijriDate) return t("date");
    if (isToday(hijriDate)) return t("today");
    if (isTomorrow(hijriDate)) return t("tomorrow");
    return formatDate(hijriDate, "DD MMMM");
  };

  return (
    <>
      <button
        type="button"
        onClick={() => !isSubmitting && setIsOpen(true)}
        disabled={isSubmitting}
        data-testid="date-prayer-input-button"
        className={`h-[38px] px-3 border rounded-md flex items-center gap-2 text-sm transition-colors  border-gray-300 dark:border-gray-600 ${
          hijriDate
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

      <CalendarModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        selectedDate={hijriDate}
        selectedRecurringType={recurringType}
        selectedRecurringInterval={recurringInterval}
        selectedRecurringEnd={recurringEnd}
        selectedRecurringEndDate={recurringEndDate}
        selectedRecurringEndOccurrences={recurringEndOccurrences}
        selectedUseGregorian={useGregorian}
        forceRecurring={forceRepeat}
        onConfirm={(
          date,
          confirmedRepeat,
          interval,
          confirmedRepeatEnd,
          confirmedRepeatEndDate,
          confirmedRepeatEndOccurrences,
          confirmedUseGregorian
        ) => {
          onChange(date);
          if (onRepeatChange)
            onRepeatChange(
              confirmedRepeat,
              interval,
              confirmedRepeatEnd,
              confirmedRepeatEndDate,
              confirmedRepeatEndOccurrences,
              confirmedUseGregorian
            );
          setIsOpen(false);
        }}
      />
    </>
  );
}
