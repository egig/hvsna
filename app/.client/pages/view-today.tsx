import { GREGORIAN_MONTH_NAMES_EN } from "~/lib/gregorian-date";
import DayView from "~/.client/components/day-view";
import {
  HijriDate,
  isSameHijriDate,
  isTodayHijriDate,
} from "~/lib/hijri/hijri-date";
import { Block, Navbar, NavTitle, NavTitleLarge, Page, useStore } from "framework7-react";
import { HIJRI_MONTH_NAMES_EN } from "~/lib/hijri-months";
import clsx from "clsx";
import { useMemo, useState } from "react";

import {Swiper, SwiperSlide} from 'swiper/react'
import 'swiper/css'
import DayNote from "../components/day-note";

export default function ViewToday() {
  const _hijriDate = HijriDate.fromDate(new Date());
  const [activeDate, setActiveDate] = useState(_hijriDate);
  const [swiper, setSwiper] = useState<any>(null)
  const gregorianDate = activeDate.toDate();
  const pageTitle = `${activeDate.day} ${HIJRI_MONTH_NAMES_EN[activeDate.month - 1]} ${activeDate.year}`;
  const subTitle =  `${activeDate.format("dddd")}, ${gregorianDate.getDate()} ${GREGORIAN_MONTH_NAMES_EN[gregorianDate.getMonth()]} ${gregorianDate.getFullYear()}`

  const slides = useMemo(() => {
    let days = [..._hijriDate.getWeekDates()];
    let weeks = [_hijriDate.getWeekDates()]
    return {days, weeks};
  }, [activeDate]);

  return (
    <Page>
      <Navbar>
        <NavTitle subtitle={subTitle}>{pageTitle}</NavTitle>
      </Navbar>
      <Block>
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {activeDate.getWeekDates().map((d: HijriDate, index: number) => (
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
                swiper.slideTo(index)
              }}
            >
              <div className="text-xs">{d.format("dd")}</div>
              <div className="text-sm sm:text-base">{d.format("DD")}</div>
            </div>
          ))}
        </div>
      </Block>
      <Swiper virtual slidesPerView={1} initialSlide={activeDate.dayOfWeek} onSlideChange={(e) => {
        setActiveDate(slides.days[e.activeIndex])
      }} onSwiper={(swiper) => {
        setSwiper(swiper)
      }}>
        {slides.days.map((date, index: number) => {
          return (
          <SwiperSlide key={index} virtualIndex={index}>
            <Block strong>
              <DayNote date={date} />
            </Block>
          </SwiperSlide>
        )})}
      </Swiper>
    </Page>
  );
}
