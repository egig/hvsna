import { GREGORIAN_MONTH_NAMES_EN } from "~/lib/gregorian-date";
import { HIJRI_MONTH_NAMES_EN } from "~/lib/hijri-months";
import { Link, useParams } from "react-router";
import MonthView from "~/.client/components/month-view";
import { HijriDate } from "~/lib/hijri/hijri-date";

export default function YearView() {
    const data = {
      year: Number(useParams().year),
    }    

    const gStart = (new HijriDate(data.year, 1, 1)).toDate()
    const gEnd = (new HijriDate(data.year, 12, 29)).toDate() 
    
    return (
      <div>
        <div className="p-4">
          <div className="mb-4">
            <h1 className="title">{data.year}</h1>
            <p className="subtitle text-right">
              {GREGORIAN_MONTH_NAMES_EN[gStart.getMonth()]} {gStart.getFullYear()} to{" "}
              {GREGORIAN_MONTH_NAMES_EN[gEnd.getMonth()]} {gEnd.getFullYear()}
            </p>
          </div>
          <div className="navigation">
            <Link to={"/y/" + (data.year - 1)}>Previous</Link>
            <Link to={"/y/" + (data.year + 1)}>Next</Link>
          </div>
        </div>
        <div className="mb-4 p-6">
          {Array.from({ length: 12 }, (_, i) => i).map((month) => (
            <div className="mb-6" key={month}>
              <div className="mb-2">
                <Link
                  className="section-title"
                  key={month}
                  to={`/y/${data.year}/m/${month + 1}`}
                >
                  {HIJRI_MONTH_NAMES_EN[month]}
                </Link>
              </div>
              <MonthView year={data.year} month={month + 1} />
            </div>
          ))}
        </div>
      </div>
    );
}