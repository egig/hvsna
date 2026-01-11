import { Link } from "react-router";
import { HIJRI_MONTH_NAMES_EN } from "lib/hijri-months";
import { GREGORIAN_MONTH_NAMES_EN } from "lib/gregorian-date";

function PraySlot({ time, name }: { time: string; name: string }) {
  return (
    <div className="mb-2 border-b pb-2 border-b-stone-300">
      <h2 className="text-base font-bold">
        {name}({time})
      </h2>
    </div>
  );
}

export interface DayViewProps {
  date: number;
  month: number;
  year: number;
  Maghrib: string;
  Isha: string;
  Fajr: string;
  Dhuhr: string;
  Asr: string;
  gDate: number;
  gMonth: number;
  gYear: number;
}

export default function DayView({
  date,
  month,
  year,
  gDate,
  gMonth,
  gYear,
  Maghrib,
  Isha,
  Fajr,
  Dhuhr,
  Asr,
}: DayViewProps) {
  return (
    <div className="p-4">
      <div className="mb-4 mx-auto">
        <h1 className="text-xl font-bold">
          {date}{" "}
          <Link to={`/y/${year}/m/${month}`}>
            {HIJRI_MONTH_NAMES_EN[month]} {year}
          </Link>
        </h1>
        <span className="text-sm">
          {gDate} {GREGORIAN_MONTH_NAMES_EN[gMonth-1]} {gYear}
        </span>
      </div>
      <div className="mb-4">
        <Link
          className="text-blue-500"
          to={"/"}
        >
          Today
        </Link>{" "}
        |
        <Link
          className="text-blue-500"
          to={`/y/${year}/m/${month}/d/${date - 1}`}
        >
          Previous
        </Link>{" "}
        |
        <Link
          className="text-blue-500"
          to={`/y/${year}/m/${month}/d/${date + 1}`}
        >
          Next
        </Link>
      </div>
      <PraySlot time={Maghrib} name="Maghrib" />
      <PraySlot time={Isha} name="Isha" />
      <PraySlot time={Fajr} name="Fajr" />
      <PraySlot time={Dhuhr} name="Dhuhr" />
      <PraySlot time={Asr} name="Asr" />
    </div>
  );
}
