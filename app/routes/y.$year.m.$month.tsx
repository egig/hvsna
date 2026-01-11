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
    return <div>
        <h1 className="font-bold text-xl">{HIJRI_MONTH_NAMES_EN[data.month]} <Link to={"/y/" + data.year}>{data.year}</Link></h1>
        <Link to={"/"}>Today</Link>
        </div>
}