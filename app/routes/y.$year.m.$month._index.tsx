import { getHijriDate, getHijriMonthDays, type HijriDate } from "lib/hijri-date";
import { HIJRI_MONTH_NAMES_EN } from "lib/hijri-months";
import { Link, useLoaderData, useParams, type LoaderFunctionArgs } from "react-router";

export function loader(request: LoaderFunctionArgs) {
    const params = request.params;
    return {
        month: params.month,
        year: params.year,
    }
}


function DateItem({children}: {children?: React.ReactNode}) {
    return <div className="w-10 h-10 inline-block text-center text-blue-500 border-1 border-gray-200">{children}</div>
}

function EmptyDayItem() {
    return <DateItem key={Math.random()} />
}

function DayItem(day: HijriDate) {
    return <DateItem key={day.date}><Link key={day.date} to={"/y/" + day.year + "/m/" + day.month + "/d/" + day.date}>{day.date}</Link></DateItem>
}

function DayNameItem(dayName: string) {
    return <DateItem key={dayName}>{dayName}</DateItem>
}

export default function m() {
    const data = useLoaderData()
    const days = getHijriMonthDays(data.year, data.month)
    const firstDate = getHijriDate(data.year, data.month, 1)


    const daysList = ["Fri", "Sat","Sun", "Mon", "Tue", "Wed", "Thu"]
    const daysMap: { [key: string]: HijriDate[] } = {}

    for (let i = 0; i < days; i++) {
        let day = getHijriDate(data.year, data.month, i+1)
        if (daysMap.hasOwnProperty(day.dayName)) {
            daysMap[day.dayName].push(day)
        } else {
            daysMap[day.dayName] = [day]
        }
    }
    
    const startDay = daysList.indexOf(firstDate.dayName)

    return <div>
        <h1 className="font-bold text-xl">{HIJRI_MONTH_NAMES_EN[data.month-1]} <Link to={"/y/" + data.year}>{data.year}</Link></h1>
        <Link to={"/"}>Today</Link>
        <div>
            {daysList.map((day) => DayNameItem(day))}
            {Array.from({ length: startDay }, (_, i) => i + 1).map((day) => EmptyDayItem())}
            {Array.from({ length: days }, (_, i) => i + 1).map((day) => DayItem(getHijriDate(data.year, data.month, day)))}
        </div>
    </div>
}