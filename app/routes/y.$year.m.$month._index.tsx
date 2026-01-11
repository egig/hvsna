import { getHijriMonthDays } from "lib/hijri-date";
import { HIJRI_MONTH_NAMES_EN } from "lib/hijri-months";
import { Link, useLoaderData, useParams, type LoaderFunctionArgs } from "react-router";

export function loader(request: LoaderFunctionArgs) {
    const params = request.params;
    return {
        month: params.month,
        year: params.year,
    }
}

export default function m() {
    const data = useLoaderData()
    const days = getHijriMonthDays(data.year, data.month + 1)

    return <div>
        <h1 className="font-bold text-xl">{HIJRI_MONTH_NAMES_EN[data.month]} <Link to={"/y/" + data.year}>{data.year}</Link></h1>
        <Link to={"/"}>Today</Link>
        <div>
            {Array.from({ length: days }, (_, i) => i + 1).map((day) => (
                <Link className="p-2 inline-block text-center text-blue-500" key={day} to={"/y/" + data.year + "/m/" + data.month + "/d/" + day}>{day}</Link>
            ))}
        </div>
    </div>
}