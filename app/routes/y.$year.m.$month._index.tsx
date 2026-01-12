import { getGregorianFromHijriDate, getHijriDate, getHijriMonthDays, getNextHijriMonth, getPreviousHijriMonth, type HijriDate } from "lib/hijri-date";
import { HIJRI_MONTH_NAMES_EN } from "lib/hijri-months";
import { Link, useLoaderData, type LoaderFunctionArgs } from "react-router";
import MonthView from "~/components/month-view";
import { GREGORIAN_MONTH_NAMES_EN } from "lib/gregorian-date";

export function loader(request: LoaderFunctionArgs) {
    const params = request.params;
    return {
        month: params.month,
        year: params.year,
    }
}



export default function m() {
    const data = useLoaderData()
    const prev = getPreviousHijriMonth(data.year, data.month)
    const next = getNextHijriMonth(data.year, data.month)
    const gStart  = getGregorianFromHijriDate(data.year, data.month, 1)
    const gEnd  = getGregorianFromHijriDate(data.year, data.month, getHijriMonthDays(data.year, data.month))

    return <div className="p-6">
        <div className="mb-4">
        <h1 className="title">
            <Link className="parent-link" to={"/y/" + data.year}>{data.year}</Link> {HIJRI_MONTH_NAMES_EN[data.month-1]}
        </h1>
        <p className="subtitle">{GREGORIAN_MONTH_NAMES_EN[gStart.month-1]} {gStart.year} to {GREGORIAN_MONTH_NAMES_EN[gEnd.month-1]} {gEnd.year}</p>
        </div>
        <div className="navigation">
            <Link to={"/"}>Today</Link>
            <Link to={"/y/" + prev.year + "/m/" + prev.month}>Previous</Link>
            <Link to={"/y/" + next.year + "/m/" +next.month}>Next</Link>
        </div>
        <MonthView year={data.year} month={data.month} />
    </div>
}