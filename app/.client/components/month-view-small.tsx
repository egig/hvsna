import clsx from "clsx";
import { HijriDate } from "~/lib/hijri/hijri-date";
import { HijriMonth } from "~/lib/hijri/hijri-month";
import { Link } from "react-router";

function EmptyDayItem() {
    return <div
    className="flex items-center justify-center text-base transition-none rounded-lg"
    key={Math.random()} />
}

function DayItem(day: HijriDate) {
    let cn = clsx("flex items-end justify-center text-[0.6rem] rounded-lg", { "bg-gray-300": day.isToday()})
    return <div
    className={cn}
    key={day.day}>
        {day.day}
        </div>
}



export default function MonthViewSmall({year, month}: {year: number; month: number}) {

    const daysList = ["Fri", "Sat","Sun", "Mon", "Tue", "Wed", "Thu"]
    const daysListSmall = ["F", "S","Su", "M", "Tu", "W", "Th"]
    const hm = new HijriMonth(year, month)

    const days = hm.getDaysInMonth()
    const firstDate = hm.getFirstDay()
    const startDay = daysList.indexOf(firstDate.format("ddd"))

    return <div className="">
        <div className="grid grid-cols-7 gap-1 mb-2.5">
            {daysListSmall.map((day) => <div className="text-[0.6rem] text-center font-semibold" key={day}>{day}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1 mb-2.5">
            {Array.from({ length: startDay }, (_, i) => i + 1).map(() => EmptyDayItem())}
            {Array.from({ length: days }, (_, i) => i + 1).map((day) => DayItem(new HijriDate(year, month, day)))}
        </div>
    </div>
}