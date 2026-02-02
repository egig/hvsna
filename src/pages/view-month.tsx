import {
  GREGORIAN_MONTH_NAMES_EN,
  HIJRI_MONTH_NAMES_EN,
} from "src/lib/hijri-months";
import { Link, useParams } from "react-router";
import { HijriMonth } from "src/lib/hijri/hijri-month";
import PrevNext from "../components/prev-next";
import MonthView from "src/components/month-view";

export default function MonthViewPage() {
  const params = useParams();
  const data = {
    month: Number(params.month),
    year: Number(params.year),
  };

  const hm = new HijriMonth(data.year, data.month);
  const prev = hm.previous();
  const next = hm.next();
  const gStart = hm.getFirstDay().toDate();
  const gEnd = hm.getLastDay().toDate();

  return (
    <div className="p-4">
      <div className="mb-4">
        <h1 className="title">
          {HIJRI_MONTH_NAMES_EN[data.month - 1]}{" "}
          <Link className="parent-link" to={"/y/" + data.year}>
            {data.year}
          </Link>
        </h1>
        <p className="subtitle text-right">
          {GREGORIAN_MONTH_NAMES_EN[gStart.getMonth() + 1]}{" "}
          {gStart.getFullYear()} to{" "}
          {GREGORIAN_MONTH_NAMES_EN[gEnd.getMonth() + 1]} {gEnd.getFullYear()}
        </p>
      </div>
      <MonthView year={data.year} month={data.month} />
      <PrevNext
        prevLink={"/y/" + prev.year + "/m/" + prev.month}
        nextLink={"/y/" + next.year + "/m/" + next.month}
      />
    </div>
  );
}
