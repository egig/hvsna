import { HIJRI_MONTH_NAMES_EN } from "lib/hijri-months";
import { Link, useLoaderData, useParams, type LoaderFunctionArgs } from "react-router";

export function loader(request: LoaderFunctionArgs) {
    const params = request.params;
    return {
        year: params.year,
    }
}

export default function m() {
    const data = useLoaderData()
    return <div>
        <h1 className="font-bold text-xl">{data.year}</h1>
        <Link to={"/"}>Today</Link>
        <div>
            {Array.from({ length: 12 }, (_, i) => i).map((month) => (
                <div>
                    <Link className="p-2 inline-block text-center text-blue-500" key={month} to={`/y/${data.year}/m/${month+1}`}>{HIJRI_MONTH_NAMES_EN[month]}</Link>
                </div>
            ))}
        </div>
    </div>
}