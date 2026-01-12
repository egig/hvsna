import { getHijriDate, getHijriMonthDays, getNextHijriMonth, getPreviousHijriMonth, type HijriDate } from "lib/hijri-date";
import { HIJRI_MONTH_NAMES_EN } from "lib/hijri-months";
import { Link, useLoaderData, type LoaderFunctionArgs } from "react-router";
import clsx from "clsx";
import { getCurrentHijriDate } from "lib/hijri-date";

export function loader(request: LoaderFunctionArgs) {
    const params = request.params;
    return {
        month: params.month,
        year: params.year,
    }
}


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

export default function m() {
    const data = useLoaderData()
    const days = getHijriMonthDays(data.year, data.month)
    const firstDate = getHijriDate(data.year, data.month, 1)


    const daysList = ["Fri", "Sat","Sun", "Mon", "Tue", "Wed", "Thu"]
    
    const startDay = daysList.indexOf(firstDate.dayName)
    const prevMonth = getPreviousHijriMonth(data.year, data.month).month
    const nextMonth = getNextHijriMonth(data.year, data.month).month


    return <div>
        <h1 className="font-bold text-xl">{HIJRI_MONTH_NAMES_EN[data.month-1]} <Link className="text-blue-500" to={"/y/" + data.year}>{data.year}</Link></h1>
        <Link to={"/"}>Today</Link>
        <Link to={"/y/" + data.year + "/m/" + prevMonth}>Previous</Link>
        <Link to={"/y/" + data.year + "/m/" + nextMonth}>Next</Link>
        <div>
            {daysList.map((day) => DayNameItem(day))}
            {Array.from({ length: startDay }, (_, i) => i + 1).map((day) => EmptyDayItem())}
            {Array.from({ length: days }, (_, i) => i + 1).map((day) => DayItem(getHijriDate(data.year, data.month, day), isToday(getHijriDate(data.year, data.month, day))))}
        </div>
    </div>
}