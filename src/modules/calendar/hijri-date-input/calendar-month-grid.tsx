import { useState } from "react";
import { gregorianToHijri, hijriToGregorian } from "@tabby_ai/hijri-converter";
import { HvChevronLeft, HvChevronRight } from "@/modules/icons";
import { useDateTranslationHelper } from "../use-date-translation-helper";
import { getDaysInMonth } from "../hijri/get-days-in-month";
import { _applyOffset } from "../hijri/core";
import { useSettings } from "@/modules/settings/context";

interface CalendarMonthGridProps {
  selectedDate: Date | null;
  onChange: (date: Date) => void;
}

function toHijri(date: Date, offset: number) {
  const raw = gregorianToHijri({
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  });
  return _applyOffset(raw, offset);
}

function toGregorian(year: number, month: number, day: number, offset: number) {
  return hijriToGregorian(_applyOffset({ year, month, day }, -offset));
}

export function CalendarMonthGrid({
  selectedDate,
  onChange,
}: CalendarMonthGridProps) {
  const { weekDays, hijriMonthNames } = useDateTranslationHelper();
  const { settings } = useSettings();
  const offset = settings.manualDateOffset ?? 0;

  const todayHijri = toHijri(new Date(), offset);
  const initialHijri = selectedDate
    ? toHijri(selectedDate, offset)
    : todayHijri;

  const [year, setYear] = useState(initialHijri.year);
  const [month, setMonth] = useState(initialHijri.month);

  const selectedHijri = selectedDate ? toHijri(selectedDate, offset) : null;
  const daysInMonth = getDaysInMonth(year, month);

  const firstDayGreg = toGregorian(year, month, 1, offset);
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
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">
          {hijriMonthNames[month - 1]} {year}
        </h3>
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

            const gregDate = hijriToGregorian({ year, month, day });
            const isToday =
              year === todayHijri.year &&
              month === todayHijri.month &&
              day === todayHijri.day;
            const isSelected =
              selectedHijri != null &&
              year === selectedHijri.year &&
              month === selectedHijri.month &&
              day === selectedHijri.day;
            const jsDate = new Date(
              gregDate.year,
              gregDate.month - 1,
              gregDate.day
            );

            return (
              <div key={index} className="aspect-3/2">
                <button
                  onClick={() => {
                    onChange(jsDate);
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
