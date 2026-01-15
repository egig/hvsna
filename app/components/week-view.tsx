import { getCurrentWeek } from "lib/hijri-date";
import DayView from "./day-view";

export default function WeekView() {
    // TODO create week view for large screen mode
  const {start, end} = getCurrentWeek();
  return <div className="flex">
    {Array.from({length: 7}, (_, i) => {
      const date = start.add(i, 'day');
      return <DayView key={i} date={date.date()} month={date.month() + 1} year={date.year()} gDate={date.date()} gMonth={date.month() + 1} gYear={date.year()} Maghrib="" Isha="" Fajr="" Dhuhr="" Asr="" prevLink="" nextLink="" dayName={date.format('ddd')} />;
    })}
  </div>; 
}