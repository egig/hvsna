import clsx from "clsx";
import { HijriDate } from "src/lib/hijri/hijri-date";
import { HijriMonth } from "src/lib/hijri/hijri-month";
import { Link } from "react-router";

function EmptyDayItem() {
  return (
    <div
      className="cursor-default aspect-[1] flex items-center justify-center text-base transition-none rounded-lg"
      key={Math.random()}
    />
  );
}

function DayItem(day: HijriDate) {
  let cn = clsx(
    "hover:bg-gray-200 aspect-[1] flex items-center justify-center text-base cursor-pointer transition-all duration-[0.2s] rounded-lg",
    { "bg-gray-200": day.isToday() },
  );
  return (
    <div className={cn} key={day.day}>
      <Link
        key={day.day}
        to={"/y/" + day.year + "/m/" + day.month + "/d/" + day.day}
      >
        {day.day}
      </Link>
    </div>
  );
}

export default function MonthView({
  year,
  month,
}: {
  year: number;
  month: number;
}) {
  const daysList = ["Fri", "Sat", "Sun", "Mon", "Tue", "Wed", "Thu"];
  const hm = new HijriMonth(year, month);

  const days = hm.getDaysInMonth();
  const firstDate = hm.getFirstDay();
  const startDay = daysList.indexOf(firstDate.format("ddd"));

  return (
    <div className="">
      <div className="grid grid-cols-[repeat(7,1fr)] gap-1 mb-2.5">
        {daysList.map((day) => (
          <div
            className="text-center font-semibold text-indigo-500 text-sm p-2"
            key={day}
          >
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-[repeat(7,1fr)] gap-1 mb-2.5">
        {Array.from({ length: startDay }, (_, i) => i + 1).map(() =>
          EmptyDayItem(),
        )}
        {Array.from({ length: days }, (_, i) => i + 1).map((day) =>
          DayItem(new HijriDate(year, month, day)),
        )}
      </div>
    </div>
  );
}
