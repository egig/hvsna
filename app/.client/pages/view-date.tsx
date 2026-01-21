import DayView from "~/.client/components/day-view";
import { useParams } from "react-router";
import { HijriDate } from "~/lib/hijri/hijri-date";

export default function DateView() {
    const params = useParams();
    const date = Number(params.date);
    const month = Number(params.month);
    const year = Number(params.year);

    const d = `${year}-${month}-${date}`;
    // @ts-ignore
    const hd = new HijriDate(year, month, date)
    const prevDate = hd.previous()
    const nextDate = hd.next()
    const gregorianDate = hd.toDate();
    const gDate = gregorianDate.getDate();
    const gMonth = gregorianDate.getMonth() + 1;
    const gYear = gregorianDate.getFullYear();
    const dayName = hd.format("dddd")

    const prevLink = `/y/${prevDate.year}/m/${prevDate.month}/d/${prevDate.day}`;
    const nextLink = `/y/${nextDate.year}/m/${nextDate.month}/d/${nextDate.day}`;
  
    return <DayView date={date} month={month} year={year} gDate={gDate} gMonth={gMonth} gYear={gYear} prevLink={prevLink} nextLink={nextLink} dayName={dayName} />
}