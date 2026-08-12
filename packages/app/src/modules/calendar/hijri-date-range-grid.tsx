import { gregorianToHijri } from "@tabby_ai/hijri-converter";
import { HvChevronLeft, HvChevronRight } from "@/modules/icons";
import { useDateTranslationHelper } from "./use-date-translation-helper";
import { _applyOffset } from "./hijri/core";
import { useSettings } from "@/modules/settings/context";
import dayjs, { type Dayjs } from "dayjs";

function toHijriDay(
  date: Date,
  monthOffsets: Partial<Record<number, number>>
): number {
  const raw = gregorianToHijri({
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  });
  return _applyOffset(raw, monthOffsets?.[raw.month] ?? 0).day;
}

interface DateRangeGridProps {
  year: number;
  month: number; // 0-based
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  startEpoch: number | null;
  endEpoch: number | null;
  onDateClick: (date: Dayjs) => void;
}

export function HijriRangeCalendarGrid({
  year,
  month,
  onPreviousMonth,
  onNextMonth,
  startEpoch,
  endEpoch,
  onDateClick,
}: DateRangeGridProps) {
  const { weekDays, gregorianMonthNames, hijriMonthNames } =
    useDateTranslationHelper();
  const { settings } = useSettings();
  const monthOffsets = settings.hijriMonthOffsets ?? {};

  const today = dayjs();
  const daysInMonth = dayjs(new Date(year, month, 1)).daysInMonth();
  const firstDayWeekday = new Date(year, month, 1).getDay(); // 0=Sunday

  // weekDays from helper starts on Friday: [Fri, Sat, Sun, Mon, Tue, Wed, Thu]
  // Reorder to Sunday-first: [Sun, Mon, Tue, Wed, Thu, Fri, Sat]
  const gregWeekDays = [2, 3, 4, 5, 6, 0, 1].map((i) => weekDays[i]);

  const cells: (number | null)[] = [
    ...Array<null>(firstDayWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const firstHijriName =
    hijriMonthNames[
      gregorianToHijri({ year, month: month + 1, day: 1 }).month - 1
    ];
  const lastHijriName =
    hijriMonthNames[
      gregorianToHijri({ year, month: month + 1, day: daysInMonth }).month - 1
    ];
  const hijriSubtitle =
    firstHijriName !== lastHijriName
      ? `${firstHijriName} – ${lastHijriName}`
      : firstHijriName;

  const rangeStart = startEpoch
    ? dayjs(startEpoch).startOf("day").valueOf()
    : null;
  const rangeEnd = endEpoch ? dayjs(endEpoch).startOf("day").valueOf() : null;

  const getButtonClass = (dayStart: number) => {
    const base =
      "w-full flex flex-col p-1 items-center justify-center rounded-md text-sm transition-colors ";
    const isStartOrEnd =
      (rangeStart !== null && dayStart === rangeStart) ||
      (rangeEnd !== null && dayStart === rangeEnd);
    const isInRange =
      rangeStart !== null &&
      rangeEnd !== null &&
      dayStart > rangeStart &&
      dayStart < rangeEnd;
    const isTodayDay = dayStart === today.startOf("day").valueOf();

    if (isStartOrEnd)
      return base + "bg-[var(--hvsna-primary-color)] text-white";
    if (isInRange)
      return (
        base +
        "bg-[var(--hvsna-primary-color-active-tab)] dark:bg-blue-900 text-white dark:text-white"
      );
    if (isTodayDay)
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
            {gregorianMonthNames[month]} {year}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {hijriSubtitle}
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
          {gregWeekDays.map((day: string) => (
            <div
              key={day}
              className="text-xs font-medium text-gray-500 dark:text-gray-400"
            >
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, index) => {
            if (day === null) {
              return <div key={index} className="aspect-3/2 w-full h-full" />;
            }

            const date = dayjs(new Date(year, month, day));
            const dayStart = date.startOf("day").valueOf();
            const hijriDay = toHijriDay(
              new Date(year, month, day),
              monthOffsets
            );

            return (
              <div key={index} className="aspect-3/2">
                <button
                  onClick={() => onDateClick(date)}
                  className={getButtonClass(dayStart)}
                >
                  <div className="text-base">{day}</div>
                  <div className="text-[0.625rem]">{hijriDay}</div>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
