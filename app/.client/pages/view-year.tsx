import { GREGORIAN_MONTH_NAMES_EN } from "lib/gregorian-date";
import { getGregorianFromHijriDate, getHijriMonthDays } from "lib/hijri-date";
import { HIJRI_MONTH_NAMES_EN } from "lib/hijri-months";
import { Link, useParams } from "react-router";
import MonthView from "~/components/month-view";


export default function YearView() {
    const data = {
      year: Number(useParams().year),
    }
    const gStart = getGregorianFromHijriDate(data.year, 1, 1)
    const gEnd = getGregorianFromHijriDate(data.year, 12, getHijriMonthDays(data.year, 12))
    
    return (
      <div>
        <div className="p-4">
          <div className="mb-4">
            <h1 className="title">{data.year}</h1>
            <p className="subtitle text-right">
              {GREGORIAN_MONTH_NAMES_EN[gStart.month - 1]} {gStart.year} to{" "}
              {GREGORIAN_MONTH_NAMES_EN[gEnd.month - 1]} {gEnd.year}
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