import React from "react";
import { HijriDate } from "src/modules/calendar/hijri";
import { Link } from "react-router";
import {
  HIJRI_MONTH_NAMES_EN,
  HIJRI_MONTH_NAMES_EN_SHORT,
} from "src/modules/calendar/hijri-months";
import MonthViewSmall from "../modules/calendar/month-view-small";

export default function YearView({ year }: { year: number }) {
  return (
    <div className="px-4 mb-24">
      <div className="max-w-7xl mx-auto">
        {/* Mobile: 3x4 grid, Desktop: 4x3 grid */}
        <div className="grid grid-cols-3 md:grid-cols-4 gap-3 md:gap-6">
          {Array.from({ length: 12 }, (_, i) => i).map((month) => (
            <div className="p-1" key={month}>
              <Link to={`/y/${year}/m/${month + 1}`}>
                <h2 className="text-sm font-bold mb-1">
                  {HIJRI_MONTH_NAMES_EN_SHORT[month]}
                </h2>
                <MonthViewSmall year={year} month={month + 1} />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
