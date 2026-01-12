import clsx from "clsx";
import { getCurrentHijriDate, getHijriDate, getHijriMonthDays, getNextHijriMonth, getPreviousHijriMonth, type HijriDate } from "lib/hijri-date";
import { Link } from "react-router";

function DateItem({children}: {children?: React.ReactNode}) {
    return <div className="w-[calc(100%/7)] inline-block h-10 text-center text-blue-500">{children}</div>
}

function EmptyDayItem() {
    return <DateItem key={Math.random()} />
}

function DayItem(day: HijriDate, isToday: boolean) {
    return <DateItem key={day.date}>
        <Link className={clsx("", { "bg-gray-200": isToday })} key={day.date} to={"/y/" + day.year + "/m/" + day.month + "/d/" + day.date}>{day.date}</Link></DateItem>
}

function DayNameItem(dayName: string) {
    return <DateItem key={dayName}>{dayName}</DateItem>
}


function isToday(day: HijriDate) {
    const today = getCurrentHijriDate()
    return day.date === today.date && day.month === today.month && day.year === today.year
}

export default function MonthView({year, month}: {year: number; month: number}) {

    const daysList = ["Fri", "Sat","Sun", "Mon", "Tue", "Wed", "Thu"]

    const days = getHijriMonthDays(year, month)
    const firstDate = getHijriDate(year, month, 1)
    const startDay = daysList.indexOf(firstDate.dayName)

    return <div>
            {daysList.map((day) => DayNameItem(day))}
            {Array.from({ length: startDay }, (_, i) => i + 1).map(() => EmptyDayItem())}
            {Array.from({ length: days }, (_, i) => i + 1).map((day) => DayItem(getHijriDate(year, month, day), isToday(getHijriDate(year, month, day))))}
        </div>
}