import { GREGORIAN_MONTH_NAMES_EN } from "~/lib/gregorian-date";
import { Link, useParams } from "react-router";
import { HijriDate } from "~/lib/hijri/hijri-date";
import YearView from "~/.client/components/year-view";
import PrevNext from "../components/prev-next";

export default function YearPage() {
    const data = {
      year: Number(useParams().year),
    }    

    const gStart = (new HijriDate(data.year, 1, 1)).toDate()
    const gEnd = (new HijriDate(data.year, 12, 29)).toDate() 
    
    return (
      <div>
        <div className="px-4 py-2">
          <div className="mb-2">
            <h1 className="title">{data.year}</h1>
            <p className="subtitle text-right">
              {GREGORIAN_MONTH_NAMES_EN[gStart.getMonth()]} {gStart.getFullYear()} to{" "}
              {GREGORIAN_MONTH_NAMES_EN[gEnd.getMonth()]} {gEnd.getFullYear()}
            </p>
          </div>
        </div>
        <YearView year={data.year} />
        <PrevNext prevLink={"/y/" + (data.year - 1)} nextLink={"/y/" + (data.year + 1)} />
      </div>
    );
}