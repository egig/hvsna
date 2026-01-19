import { HIJRI_MONTH_NAMES_EN } from "~/lib/hijri-months";
import { Link, useParams } from "react-router";
import MonthView from "~/.client/components/month-view";
import { GREGORIAN_MONTH_NAMES_EN } from "~/lib/gregorian-date";
import { HijriMonth } from "~/lib/hijri/hijri-month";


export default function MonthViewPage() {
    const params = useParams();
    const data = {
        month: Number(params.month),
        year: Number(params.year)
    }

    const hm = new HijriMonth(data.year, data.month)
    const prev = hm.previous()
    const next = hm.next()
    const gStart  = hm.getFirstDay()
    const gEnd  = hm.getLastDay()

    return <div className="p-4">
        <div className="mb-4">
        <h1 className="title">
            {HIJRI_MONTH_NAMES_EN[data.month-1]} <Link className="parent-link" to={"/y/" + data.year}>{data.year}</Link>
        </h1>
        <p className="subtitle text-right">{GREGORIAN_MONTH_NAMES_EN[gStart.month-1]} {gStart.year} to {GREGORIAN_MONTH_NAMES_EN[gEnd.month-1]} {gEnd.year}</p>
        </div>
        <div className="navigation text-right">
            <Link to={"/y/" + prev.year + "/m/" + prev.month}>Previous</Link>
            <Link to={"/y/" + next.year + "/m/" +next.month}>Next</Link>
        </div>
        <MonthView year={data.year} month={data.month} />
    </div>
}