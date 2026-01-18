import { Link } from "react-router";
import { HIJRI_MONTH_NAMES_EN } from "lib/hijri-months";
import { GREGORIAN_MONTH_NAMES_EN } from "lib/gregorian-date";
import { TextEditor } from "./text-editor";
import { useDayData } from "~/hooks/useDayData";


export interface DayViewProps {
  date: number;
  month: number;
  year: number;
  gDate: number;
  gMonth: number;
  gYear: number;
  prevLink: string;
  nextLink: string;
  dayName?: string;
}

let emptyContent = {
    type: 'doc',
    content: [{
      type: 'paragraph',
      content: []
    }]
  }

export default function DayView({
  date,
  month,
  year,
  gDate,
  gMonth,
  gYear,
  dayName,
  prevLink,
  nextLink
}: DayViewProps) {

  const { dayData, saveDayData } = useDayData(`${year}-${month}-${date}`);

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
          {dayName}, {gDate} {GREGORIAN_MONTH_NAMES_EN[gMonth-1]} {gYear}
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
      <div>
        <TextEditor content={dayData?.content?.[0] || emptyContent} placeholder="Write..." onChange={async (jsonContent) => {
          await saveDayData({
            id: `${year}-${month}-${date}`,
            content: [jsonContent],
            version: 1,
          });
        }} />
      </div>
    </div>
  );
}
