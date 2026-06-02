import { useState } from "react";
import { gregorianToHijri, hijriToGregorian } from "@tabby_ai/hijri-converter";
import { HvChevronLeft, HvChevronRight } from "@/modules/icons";
import { useDateTranslationHelper } from "../use-date-translation-helper";
import { getDaysInMonth } from "../hijri/get-days-in-month";
import { _applyOffset } from "../hijri/core";
import { useSettings } from "@/modules/settings/context";
import { useHijriDate } from "../hijri/use-hijri-date";
import {
  formatHijriDateString,
  parseHijriDateString,
} from "@/modules/task/task-form-helpers";

interface CalendarMonthGridProps {
  selectedDate: string | null;
  onChange: (date: string) => void;
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

function toGregorian(
  year: number,
  month: number,
  day: number,
  monthOffsets: Partial<Record<number, number>>
) {
  const offset = monthOffsets?.[month] ?? 0;
  return hijriToGregorian(_applyOffset({ year, month, day }, -offset));
}

export function CalendarMonthGrid({
  selectedDate,
  onChange,
}: CalendarMonthGridProps) {
  const { weekDays, hijriMonthNames, gregorianMonthNames } =
    useDateTranslationHelper();
  const { settings } = useSettings();
  const monthOffsets = settings.hijriMonthOffsets ?? {};
  const { currentHijriDate } = useHijriDate();

  const todayHijri = toHijri(new Date(), monthOffsets);
  const initialHijri = selectedDate
    ? parseHijriDateString(selectedDate as string)
    : todayHijri;

  const [year, setYear] = useState(initialHijri.year);
  const [month, setMonth] = useState(initialHijri.month);

  const selectedHijri = selectedDate
    ? parseHijriDateString(selectedDate)
    : null;
  const daysInMonth = getDaysInMonth(year, month);

  const lastDayGreg = toGregorian(year, month, daysInMonth, monthOffsets);

  const firstDayGreg = toGregorian(year, month, 1, monthOffsets);
  const firstDayDate = new Date(
    firstDayGreg.year,
    firstDayGreg.month - 1,
    firstDayGreg.day
  );
  const weekOffset = (firstDayDate.getDay() - 5 + 7) % 7; // week starts Friday

  const cells: (number | null)[] = [
    ...Array<null>(weekOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const handlePrev = () => {
    if (month === 1) {
      setYear((y) => y - 1);
      setMonth(12);
    } else setMonth((m) => m - 1);
  };

  const handleNext = () => {
    if (month === 12) {
      setYear((y) => y + 1);
      setMonth(1);
    } else setMonth((m) => m + 1);
  };

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
            {hijriMonthNames[month - 1]} {year}
          </h3>
          <p className="text-xs">
            {firstDayGreg.day} {gregorianMonthNames[firstDayGreg.month - 1]} -{" "}
            {lastDayGreg.day} {gregorianMonthNames[lastDayGreg.month - 1]}
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
          {cells.map((day, index) => {
            if (day === null) {
              return <div key={index} className="aspect-3/2 w-full h-full" />;
            }

            const gregDate = toGregorian(year, month, day, monthOffsets);
            const isToday =
              year === currentHijriDate.year &&
              month === currentHijriDate.month &&
              day === currentHijriDate.day;
            const isSelected =
              selectedHijri != null &&
              year === selectedHijri.year &&
              month === selectedHijri.month &&
              day === selectedHijri.day;

            return (
              <div key={index} className="aspect-3/2">
                <button
                  onClick={() => {
                    onChange(formatHijriDateString(year, month, day));
                  }}
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
                  <div className="text-[0.625rem]">{gregDate.day}</div>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
