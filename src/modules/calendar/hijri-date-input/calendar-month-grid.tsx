import { useState } from "react";
import { gregorianToHijri } from "@tabby_ai/hijri-converter";
import { HvChevronLeft, HvChevronRight } from "@/modules/icons";
import { useDateTranslationHelper } from "../use-date-translation-helper";
import { _applyOffset } from "../hijri/core";
import { useSettings } from "@/modules/settings/context";
import dayjs from "dayjs";

interface CalendarMonthGridProps {
  selectedDate: string | null; // YYYY-MM-DD Gregorian ISO
  onChange: (date: string) => void; // returns YYYY-MM-DD
}

function toHijri(date: Date, monthOffsets: Partial<Record<number, number>>) {
  const raw = gregorianToHijri({
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  });
  const offset = monthOffsets?.[raw.month] ?? 0;
  return _applyOffset(raw, offset);
}

export function CalendarMonthGrid({
  selectedDate,
  onChange,
}: CalendarMonthGridProps) {
  const { weekDays, gregorianMonthNames, hijriMonthNames } =
    useDateTranslationHelper();
  const { settings } = useSettings();
  const monthOffsets = settings.hijriMonthOffsets ?? {};

  const today = dayjs();
  const initial = selectedDate ? dayjs(selectedDate) : today;

  const [year, setYear] = useState(initial.year());
  const [month, setMonth] = useState(initial.month()); // 0-based

  const daysInMonth = dayjs(new Date(year, month, 1)).daysInMonth();
  const firstDayWeekday = new Date(year, month, 1).getDay(); // 0=Sunday

  // weekDays from helper starts on Friday: [Fri, Sat, Sun, Mon, Tue, Wed, Thu]
  // Reorder to Sunday-first: [Sun, Mon, Tue, Wed, Thu, Fri, Sat]
  const gregWeekDays = [2, 3, 4, 5, 6, 0, 1].map((i) => weekDays[i]);

  const cells: (number | null)[] = [
    ...Array<null>(firstDayWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const handlePrev = () => {
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else setMonth((m) => m - 1);
  };

  const handleNext = () => {
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else setMonth((m) => m + 1);
  };

  const firstHijri = toHijri(new Date(year, month, 1), monthOffsets);
  const lastHijri = toHijri(new Date(year, month, daysInMonth), monthOffsets);
  const hijriSubtitle =
    firstHijri.month !== lastHijri.month
      ? `${hijriMonthNames[firstHijri.month - 1]} – ${
          hijriMonthNames[lastHijri.month - 1]
        } ${lastHijri.year}`
      : `${hijriMonthNames[firstHijri.month - 1]} ${firstHijri.year}`;

  return (
    <div>
      <div className="flex items-center justify-between p-2 gap-2">
        <button
          onClick={handlePrev}
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
          onClick={handleNext}
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

            const hijri = toHijri(new Date(year, month, day), monthOffsets);
            const dateStr = dayjs(new Date(year, month, day)).format(
              "YYYY-MM-DD"
            );
            const isToday =
              today.year() === year &&
              today.month() === month &&
              today.date() === day;
            const isSelected = selectedDate === dateStr;

            return (
              <div key={index} className="aspect-3/2">
                <button
                  onClick={() => onChange(dateStr)}
                  data-testid={isToday ? "calendar-today-button" : undefined}
                  className={`w-full flex flex-col p-1 items-center justify-center rounded-md text-sm transition-colors ${
                    isSelected
                      ? "bg-[var(--hvsna-primary-color)] text-white"
                      : isToday
                      ? "bg-[var(--hvsna-primary-color-active-tab)] dark:bg-blue-900 text-white dark:text-white"
                      : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                  }`}
                >
                  <div className="text-base">{day}</div>
                  <div className="text-[0.625rem]">{hijri.day}</div>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
