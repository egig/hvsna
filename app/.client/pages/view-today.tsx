import { getCurrentGregorianDate } from "~/lib/gregorian-date";
import DayView from "~/.client/components/day-view";
import { HijriDate } from "~/lib/hijri/hijri-date";

export default function Home() {

  const hijriDate = HijriDate.fromDate(new Date());
  const gregorianDate = hijriDate.toDate();

    const prevDate = hijriDate.previous();
    const nextDate = hijriDate.next();
    const prevLink = `/y/${prevDate.year}/m/${prevDate.month}/d/${prevDate.day}`;
    const nextLink = `/y/${nextDate.year}/m/${nextDate.month}/d/${nextDate.day}`;
  
    return <DayView date={hijriDate.day} month={hijriDate.month} year={hijriDate.year} gDate={gregorianDate.getDate()} gMonth={gregorianDate.getMonth() + 1} gYear={gregorianDate.getFullYear()} prevLink={prevLink} nextLink={nextLink} dayName={hijriDate.format("dddd")} />
}