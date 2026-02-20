import {
  HijriDate,
  isSameHijriDate,
  isTodayHijriDate,
} from "src/modules/calendar/hijri/hijri-date";
import clsx from "clsx";
import { useMemo, useState } from "react";

import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import DayNote from "../modules/note/day-note";
import Block from "../components/block";
import { Navbar, Page } from "../modules/navigation";
import {
  GREGORIAN_MONTH_NAMES_EN,
  HIJRI_MONTH_NAMES_EN,
} from "src/modules/calendar/hijri-months";

// Helper function to generate multiple weeks
function generateWeeks(
  centerDate: HijriDate,
  weeksBefore: number = 2,
  weeksAfter: number = 2,
): HijriDate[][] {
  const weeks: HijriDate[][] = [];
  const startWeek = centerDate.startOfWeek();

  // Generate weeks before
  for (let i = weeksBefore; i > 0; i--) {
    const weekStart = new HijriDate(
      startWeek.year,
      startWeek.month,
      startWeek.day,
    );
    for (let j = 0; j < i * 7; j++) {
      weekStart._rawGregorianDate.setDate(
        weekStart._rawGregorianDate.getDate() - 1,
      );
    }
    weeks.push(weekStart.getWeekDates());
  }

  // Current week
  weeks.push(startWeek.getWeekDates());

  // Generate weeks after
  for (let i = 1; i <= weeksAfter; i++) {
    const weekStart = new HijriDate(
      startWeek.year,
      startWeek.month,
      startWeek.day,
    );
    for (let j = 0; j < i * 7; j++) {
      weekStart._rawGregorianDate.setDate(
        weekStart._rawGregorianDate.getDate() + 1,
      );
    }
    weeks.push(weekStart.getWeekDates());
  }

  return weeks;
}

// Helper function to get week index from date
function getWeekIndexFromDate(date: HijriDate, weeks: HijriDate[][]): number {
  for (let i = 0; i < weeks.length; i++) {
    if (weeks[i].some((d) => isSameHijriDate(d, date))) {
      return i;
    }
  }
  return 2; // Default to center week
}

export default function ViewToday() {
  const _hijriDate = HijriDate.fromDate(new Date());
  const [activeDate, setActiveDate] = useState(_hijriDate);
  const [currentWeekIndex, setCurrentWeekIndex] = useState(2); // Center week index
  const [weekSwiper, setWeekSwiper] = useState<any>(null);
  const [dateSwiper, setDateSwiper] = useState<any>(null);
  const gregorianDate = activeDate.toDate();
  const pageTitle = `${activeDate.day} ${HIJRI_MONTH_NAMES_EN[activeDate.month - 1]} ${activeDate.year}`;
  const subTitle = `${activeDate.format("dddd")}, ${gregorianDate.getDate()} ${GREGORIAN_MONTH_NAMES_EN[gregorianDate.getMonth()]} ${gregorianDate.getFullYear()}`;

  const weeks = useMemo(() => {
    return generateWeeks(_hijriDate);
  }, [_hijriDate]);

  const allDates = useMemo(() => {
    return weeks.flat();
  }, [weeks]);

  const currentDateIndex = useMemo(() => {
    return allDates.findIndex((d) => isSameHijriDate(d, activeDate));
  }, [allDates, activeDate]);

  return (
    <Page>
      <Navbar
        title={
          <div
            onClick={() => {
              const today = HijriDate.fromDate(new Date());
              setActiveDate(today);
              const todayWeekIndex = getWeekIndexFromDate(today, weeks);
              setCurrentWeekIndex(todayWeekIndex);
              const todayDateIndex = allDates.findIndex((d) =>
                isSameHijriDate(d, today),
              );

              if (weekSwiper) {
                weekSwiper.slideTo(todayWeekIndex);
              }
              if (dateSwiper) {
                dateSwiper.slideTo(todayDateIndex);
              }
            }}
          >
            {pageTitle}
            <div className="text-sm text-gray-500">{subTitle}</div>
          </div>
        }
      />
      <Block>
        <Swiper
          slidesPerView={1}
          initialSlide={currentWeekIndex}
          onSlideChange={(e) => {
            setCurrentWeekIndex(e.activeIndex);
            const newWeekDates = weeks[e.activeIndex];
            if (newWeekDates && newWeekDates.length > 0) {
              setActiveDate(newWeekDates[0]);
              // Sync date swiper to first day of new week
              const newDateIndex = allDates.findIndex((d) =>
                isSameHijriDate(d, newWeekDates[0]),
              );
              if (dateSwiper && newDateIndex !== -1) {
                dateSwiper.slideTo(newDateIndex);
              }
            }
          }}
          onSwiper={(swiper) => {
            setWeekSwiper(swiper);
          }}
        >
          {weeks.map((weekDates, weekIndex: number) => {
            return (
              <SwiperSlide key={weekIndex}>
                <div className="grid grid-cols-7 gap-1 sm:gap-2">
                  {weekDates.map((d: HijriDate, index: number) => (
                    <div
                      className={clsx(
                        "text-center rounded-md border-1",
                        isTodayHijriDate(d) && "bg-gray-200",
                        isSameHijriDate(d, activeDate)
                          ? "border-gray-300"
                          : "border-transparent",
                      )}
                      key={index}
                      onClick={() => {
                        setActiveDate(d);
                        const newDateIndex = allDates.findIndex((date) =>
                          isSameHijriDate(date, d),
                        );
                        if (dateSwiper && newDateIndex !== -1) {
                          dateSwiper.slideTo(newDateIndex);
                        }
                      }}
                    >
                      <div className="text-xs">{d.format("dd")}</div>
                      <div className="text-sm sm:text-base">
                        {d.format("DD")}
                      </div>
                    </div>
                  ))}
                </div>
              </SwiperSlide>
            );
          })}
        </Swiper>
      </Block>
      <Swiper
        virtual
        slidesPerView={1}
        initialSlide={currentDateIndex}
        onSlideChange={(e) => {
          const newActiveDate = allDates[e.activeIndex];
          if (newActiveDate) {
            setActiveDate(newActiveDate);
            // Update week swiper when date changes
            const newWeekIndex = getWeekIndexFromDate(newActiveDate, weeks);
            if (weekSwiper && newWeekIndex !== currentWeekIndex) {
              setCurrentWeekIndex(newWeekIndex);
              weekSwiper.slideTo(newWeekIndex);
            }
          }
        }}
        onSwiper={(swiper) => {
          setDateSwiper(swiper);
        }}
      >
        {allDates.map((date, index: number) => {
          return (
            <SwiperSlide key={index} virtualIndex={index}>
              <DayNote date={date} />
            </SwiperSlide>
          );
        })}
      </Swiper>
    </Page>
  );
}
