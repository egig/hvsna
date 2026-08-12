import { useState, useRef, useEffect } from "react";
import { gregorianToHijri } from "@tabby_ai/hijri-converter";
import { HvChevronLeft, HvChevronRight } from "@/modules/icons";
import { useDateTranslationHelper } from "../use-date-translation-helper";
import { _applyOffset } from "../hijri/core";
import { useSettings } from "@/modules/settings/context";
import dayjs from "dayjs";

interface CalendarMonthGridProps {
  selectedDate: string | null;
  onChange: (date: string) => void;
  isOpen?: boolean;
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
  isOpen,
}: CalendarMonthGridProps) {
  const { weekDays, gregorianMonthNames, hijriMonthNames } =
    useDateTranslationHelper();
  const { settings } = useSettings();
  const monthOffsets = settings.hijriMonthOffsets ?? {};

  const today = dayjs();
  const initial = selectedDate ? dayjs(selectedDate) : today;

  // Stable list of ±18 months computed once from the initial date
  const months = useRef(
    Array.from({ length: 37 }, (_, i) => {
      const d = initial.add(i - 18, "month");
      return { year: d.year(), month: d.month() };
    })
  ).current;

  const initialIdx = 18;

  const [visibleYear, setVisibleYear] = useState(initial.year());
  const [visibleMonth, setVisibleMonth] = useState(initial.month());
  const [visibleIdx, setVisibleIdx] = useState(initialIdx);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const monthRefs = useRef<(HTMLDivElement | null)[]>([]);

  // weekDays from helper starts on Friday — reorder to Sunday-first
  const gregWeekDays = [2, 3, 4, 5, 6, 0, 1].map((i) => weekDays[i]);

  // Hijri subtitle for the currently visible Gregorian month
  const daysInVisibleMonth = dayjs(
    new Date(visibleYear, visibleMonth, 1)
  ).daysInMonth();
  const firstHijriVisible = toHijri(
    new Date(visibleYear, visibleMonth, 1),
    monthOffsets
  );
  const lastHijriVisible = toHijri(
    new Date(visibleYear, visibleMonth, daysInVisibleMonth),
    monthOffsets
  );
  const oddMonthClass = "p-1 rounded bg-primary-50 dark:bg-primary-950/30";
  const hijriSubtitle =
    firstHijriVisible.month !== lastHijriVisible.month ? (
      <span>
        <span
          className={
            firstHijriVisible.month % 2 !== 0 ? oddMonthClass : undefined
          }
        >
          {hijriMonthNames[firstHijriVisible.month - 1]}
        </span>
        {" – "}
        <span
          className={
            lastHijriVisible.month % 2 !== 0 ? oddMonthClass : undefined
          }
        >
          {hijriMonthNames[lastHijriVisible.month - 1]}
        </span>{" "}
        {lastHijriVisible.year}
      </span>
    ) : (
      <span>
        <span
          className={
            firstHijriVisible.month % 2 !== 0 ? oddMonthClass : undefined
          }
        >
          {hijriMonthNames[firstHijriVisible.month - 1]}
        </span>{" "}
        {firstHijriVisible.year}
      </span>
    );

  // Sync header title as user scrolls
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const containerTop = container.scrollTop;
      let bestIdx = 0;
      let bestDist = Infinity;
      monthRefs.current.forEach((el, idx) => {
        if (!el) return;
        const dist = Math.abs(el.offsetTop - containerTop);
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = idx;
        }
      });
      if (months[bestIdx]) {
        setVisibleYear(months[bestIdx].year);
        setVisibleMonth(months[bestIdx].month);
        setVisibleIdx(bestIdx);
      }
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [months]);

  // Scroll to the selected month whenever the popover opens or selectedDate changes.
  // Must depend on isOpen because offsetTop is 0 while the popover is hidden (display:none).
  useEffect(() => {
    if (isOpen === false) return;
    const container = scrollContainerRef.current;
    if (!container) return;

    let idx = initialIdx;
    if (selectedDate) {
      const d = dayjs(selectedDate);
      const found = months.findIndex(
        (m) => m.year === d.year() && m.month === d.month()
      );
      if (found !== -1) idx = found;
    }

    const el = monthRefs.current[idx];
    if (el) container.scrollTop = el.offsetTop;
  }, [isOpen, selectedDate]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePrev = () => {
    const idx = visibleIdx - 1;
    const container = scrollContainerRef.current;
    const el = monthRefs.current[idx];
    if (idx >= 0 && container && el) {
      container.scrollTo({ top: el.offsetTop, behavior: "smooth" });
    }
  };

  const handleNext = () => {
    const idx = visibleIdx + 1;
    const container = scrollContainerRef.current;
    const el = monthRefs.current[idx];
    if (idx < months.length && container && el) {
      container.scrollTo({ top: el.offsetTop, behavior: "smooth" });
    }
  };

  return (
    <div>
      {/* Sticky navigation header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 flex items-center justify-between p-2 gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={handlePrev}
          disabled={visibleIdx === 0}
          className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-md transition-colors disabled:opacity-30"
        >
          <HvChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex flex-col items-center">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">
            {gregorianMonthNames[visibleMonth]} {visibleYear}
          </h3>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {hijriSubtitle}
          </div>
        </div>
        <button
          onClick={handleNext}
          disabled={visibleIdx === months.length - 1}
          className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-md transition-colors disabled:opacity-30"
        >
          <HvChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Scrollable multi-month grid — height = weekday header + 5 rows × h-10 + 4 gaps */}
      <div
        ref={scrollContainerRef}
        className="overflow-y-auto h-[256px] relative"
      >
        {months.map(({ year: y, month: m }, idx) => {
          const daysInMonth = dayjs(new Date(y, m, 1)).daysInMonth();
          const firstDayWeekday = new Date(y, m, 1).getDay();
          const cells: (number | null)[] = [
            ...Array<null>(firstDayWeekday).fill(null),
            ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
          ];

          return (
            <div
              key={`${y}-${m}`}
              ref={(el) => {
                monthRefs.current[idx] = el;
              }}
              data-month-index={idx}
              className="p-2 border-b border-gray-200 dark:border-gray-700"
            >
              {/* Weekday row */}
              <div className="grid grid-cols-7 gap-1 text-center mb-1">
                {gregWeekDays.map((day: string) => (
                  <div
                    key={day}
                    className="text-xs font-medium text-gray-500 dark:text-gray-400"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7">
                {cells.map((day, cellIdx) => {
                  if (day === null) {
                    return <div key={cellIdx} className="h-10" />;
                  }

                  const hijri = toHijri(new Date(y, m, day), monthOffsets);
                  const dateStr = dayjs(new Date(y, m, day)).format(
                    "YYYY-MM-DD"
                  );
                  const isToday =
                    today.year() === y &&
                    today.month() === m &&
                    today.date() === day;
                  const isSelected = selectedDate === dateStr;
                  const isOddHijriMonth = hijri.month % 2 !== 0;

                  return (
                    <div key={cellIdx} className="h-10">
                      <button
                        onClick={() => onChange(dateStr)}
                        data-testid={
                          isToday ? "calendar-today-button" : undefined
                        }
                        className={`w-full h-full flex flex-col p-2 items-center justify-center text-sm transition-colors ${
                          isSelected
                            ? "bg-[var(--hvsna-primary-color)] text-white"
                            : isToday
                            ? "bg-[var(--hvsna-primary-color-active-tab)] dark:bg-blue-900 text-white dark:text-white"
                            : isOddHijriMonth
                            ? "bg-primary-50 dark:bg-primary-950/30 hover:bg-primary-100 dark:hover:bg-primary-900/40 text-gray-900 dark:text-white"
                            : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                        }`}
                      >
                        <div className="text-sm">{day}</div>
                        <div className="text-[0.625rem]">{hijri.day}</div>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
