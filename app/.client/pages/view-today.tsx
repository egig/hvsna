import { getCurrentGregorianDate } from "lib/gregorian-date";
import { getCurrentHijriDate, getNextHijriDate, getPreviousHijriDate } from "lib/hijri-date";
import DayView from "~/components/day-view";

export default function Home() {

  const hijriDate = getCurrentHijriDate();
  const gregorianDate = getCurrentGregorianDate();

    const prevDate = getPreviousHijriDate(hijriDate.year, hijriDate.month, hijriDate.date);
    const nextDate = getNextHijriDate(hijriDate.year, hijriDate.month, hijriDate.date);
    const prevLink = `/y/${prevDate.year}/m/${prevDate.month}/d/${prevDate.date}`;
    const nextLink = `/y/${nextDate.year}/m/${nextDate.month}/d/${nextDate.date}`;
  
    return <DayView date={hijriDate.date} month={hijriDate.month} year={hijriDate.year} gDate={gregorianDate.date} gMonth={gregorianDate.month} gYear={gregorianDate.year} prevLink={prevLink} nextLink={nextLink} dayName={hijriDate.dayName} />
}