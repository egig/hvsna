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
        </div>
}