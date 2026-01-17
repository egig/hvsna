import { Link } from "react-router";
import { HIJRI_MONTH_NAMES_EN } from "lib/hijri-months";
import { GREGORIAN_MONTH_NAMES_EN } from "lib/gregorian-date";
import { TextEditor } from "./text-editor";
import { useEditorDB } from "../utils/useEditorDB";


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

  let docId = `${year}-${month}-${date}`;
  const { updateDocument, getDocument } = useEditorDB();
  // const doc = getDocument(docId);

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
        <TextEditor placeholder="Write..." onChange={(jsonContent) => {
          console.log(jsonContent)
          updateDocument(docId, {
            content: [jsonContent]
          })
        }} />
      </div>
    </div>
  );
}
