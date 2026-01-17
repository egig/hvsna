import { getNextHijriDate, getPreviousHijriDate } from "lib/hijri-date";
import DayView from "~/components/day-view";
import { useParams } from "react-router";
import dayjs from "dayjs";
import { useEffect } from "react";

export default function DateView() {
    const params = useParams();
    const date = Number(params.date);
    const month = Number(params.month);
    const year = Number(params.year);

    const d = `${year}-${month}-${date}`;
    // @ts-ignore
    const gregorianDate = dayjs(d, {hijri: true});


    const gDate = gregorianDate.date();
    const gMonth = gregorianDate.month() + 1;
    const gYear = gregorianDate.year();
    const dayName = gregorianDate.format('dddd');

    const prevDate = getPreviousHijriDate(year, month, date);
    const nextDate = getNextHijriDate(year, month, date);
    const prevLink = `/y/${prevDate.year}/m/${prevDate.month}/d/${prevDate.date}`;
    const nextLink = `/y/${nextDate.year}/m/${nextDate.month}/d/${nextDate.date}`;
  
    return <DayView date={date} month={month} year={year} gDate={gDate} gMonth={gMonth} gYear={gYear} prevLink={prevLink} nextLink={nextLink} dayName={dayName} />
}