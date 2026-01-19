import DayView from "~/.client/components/day-view";
import { useParams } from "react-router";
import dayjs from "dayjs";
import { useEffect } from "react";
import { HijriDate } from "~/lib/hijri/hijri-date";

export default function DateView() {
    const params = useParams();
    const date = Number(params.date);
    const month = Number(params.month);
    const year = Number(params.year);

    const d = `${year}-${month}-${date}`;
    // @ts-ignore
    const gregorianDate = dayjs(d, {hijri: true});

    const hd = new HijriDate(year, month, date)
    const prevDate = hd.previous()
    const nextDate = hd.next()

    const gDate = gregorianDate.date();
    const gMonth = gregorianDate.month() + 1;
    const gYear = gregorianDate.year();
    const dayName = gregorianDate.format('dddd');

    const prevLink = `/y/${prevDate.year}/m/${prevDate.month}/d/${prevDate.day}`;
    const nextLink = `/y/${nextDate.year}/m/${nextDate.month}/d/${nextDate.day}`;
  
    return <DayView date={date} month={month} year={year} gDate={gDate} gMonth={gMonth} gYear={gYear} prevLink={prevLink} nextLink={nextLink} dayName={dayName} />
}