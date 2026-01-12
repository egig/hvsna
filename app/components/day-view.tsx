import { Link } from "react-router";
import { HIJRI_MONTH_NAMES_EN } from "lib/hijri-months";
import { GREGORIAN_MONTH_NAMES_EN } from "lib/gregorian-date";

function PraySlot({ time, name }: { time: string; name: string }) {
  return (
    <div className="mb-6 border-b pb-2 border-b-stone-300">
      <h2 className="section-title">
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
  prevLink: string;
  nextLink: string;
  dayName?: string;
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
  dayName,
  prevLink,
  nextLink
}: DayViewProps) {
  return (
    <div className="p-6">
      <div className="mb-4 mx-auto">
        <h1 className="title">
          <Link className="parent-link" to={`/y/${year}/m/${month}`}>
            {year}{" "}
            {HIJRI_MONTH_NAMES_EN[month-1]}
          </Link>
          {" "}{date}
        </h1>
        <p className="subtitle">
          {dayName} {gDate} {GREGORIAN_MONTH_NAMES_EN[gMonth-1]} {gYear}
        </p>
      </div>
      <div className="navigation">
        <Link
          to={"/"}
        >
          Today
        </Link>
        <Link
          to={prevLink}
        >
          Previous
        </Link>
        <Link
          to={nextLink}
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
