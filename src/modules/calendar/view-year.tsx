import { Link, useParams } from "react-router";
import { gregorianToHijri, hijriToGregorian } from "@tabby_ai/hijri-converter";
import { HijriDate } from "./hijri/hijri-date";
import PrevNext from "../components/prev-next";
import YearView from "src/ui/year-view";
import { GREGORIAN_MONTH_NAMES_EN } from "src/modules/calendar/hijri-months";

export default function YearPage() {
  const data = {
    year: Number(useParams().year),
  };

  const gStart = HijriDate.fromDate(
    new Date(new Date().getFullYear(), 0, 1),
  ).toDate();
  const gEnd = HijriDate.fromDate(
    new Date(new Date().getFullYear(), 11, 31),
  ).toDate();

  return (
    <div>
      <div className="px-4 py-2">
        <div className="mb-2">
          <h1 className="title">{data.year}</h1>
          <p className="subtitle text-right">
            {GREGORIAN_MONTH_NAMES_EN[gStart.getMonth()]} {gStart.getFullYear()}{" "}
            to {GREGORIAN_MONTH_NAMES_EN[gEnd.getMonth()]} {gEnd.getFullYear()}
          </p>
        </div>
      </div>
      <YearView year={data.year} />
      <PrevNext
        prevLink={"/y/" + (data.year - 1)}
        nextLink={"/y/" + (data.year + 1)}
      />
    </div>
  );
}
