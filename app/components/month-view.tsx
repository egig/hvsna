import clsx from "clsx";
import { getCurrentHijriDate, getHijriDate, getHijriMonthDays, getNextHijriMonth, getPreviousHijriMonth, type HijriDate } from "lib/hijri-date";
import { Link } from "react-router";

function EmptyDayItem() {
    return <div
    className="cursor-default aspect-[1] flex items-center justify-center text-base transition-none rounded-lg"
    key={Math.random()} />
}

function DayItem(day: HijriDate, isToday: boolean) {
    let cn = clsx("hover:bg-gray-200 aspect-[1] flex items-center justify-center text-base cursor-pointer transition-all duration-[0.2s] rounded-lg", { "bg-gray-200": isToday })
    return <div
    className={cn}
    key={day.date}>
        <Link key={day.date} to={"/y/" + day.year + "/m/" + day.month + "/d/" + day.date}>{day.date}</Link></div>
}


function isToday(day: HijriDate) {
    const today = getCurrentHijriDate()
    return day.date === today.date && day.month === today.month && day.year === today.year
}


export default function MonthView({year, month}: {year: number; month: number}) {

    const daysList = ["Sat","Sun", "Mon", "Tue", "Wed", "Thu", "Fri"]

    const days = getHijriMonthDays(year, month)
    const firstDate = getHijriDate(year, month, 1)
    const startDay = daysList.indexOf(firstDate.dayName)

    return <div className="max-w-[400px]">
        <div className="grid grid-cols-[repeat(7,1fr)] gap-1 mb-2.5">
            {daysList.map((day) => <div className="text-center font-semibold text-indigo-500 text-sm p-2" key={day}>{day}</div>)}
        </div>
        <div className="grid grid-cols-[repeat(7,1fr)] gap-1 mb-2.5">
            {Array.from({ length: startDay }, (_, i) => i + 1).map(() => EmptyDayItem())}
            {Array.from({ length: days }, (_, i) => i + 1).map((day) => DayItem(getHijriDate(year, month, day), isToday(getHijriDate(year, month, day))))}
        </div>
    </div>
}