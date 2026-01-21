import { Link, useNavigate } from "react-router";
import { HIJRI_MONTH_NAMES_EN } from "~/lib/hijri-months";
import { GREGORIAN_MONTH_NAMES_EN } from "~/lib/gregorian-date";
import { useDayData } from "~/.client/hooks/useDayData";
import PrevNext from "~/.client/components/prev-next";
import {
  HijriDate,
  isTodayHijriDate,
  isSameHijriDate,
} from "~/lib/hijri/hijri-date";
import clsx from "clsx";
import { TextEditor } from "./text-editor";
import { useSwipeable } from "react-swipeable";

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
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [],
    },
  ],
};

export default function DayView({
  date,
  month,
  year,
  gDate,
  gMonth,
  gYear,
  dayName,
  prevLink,
  nextLink,
}: DayViewProps) {
  const { dayData, saveDayData } = useDayData(`${year}-${month}-${date}`);
  const theDay = new HijriDate(year, month, date);
  const navigate = useNavigate();
  const handlers = useSwipeable({
    onSwipedLeft: () => {
      navigate(nextLink, {viewTransition: true});
    },
    onSwipedRight: () => {
      navigate(prevLink, {viewTransition: true});
    },
  });

  const dateLabel = `${dayName}, ${date} ${HIJRI_MONTH_NAMES_EN[month - 1]} ${year}`;
  const placeholder = `Write for ${dateLabel}...`;

  return (
    <div className="p-4">
      <div className="mb-4 mx-auto">
        <h1 className="title text-right">
          {date}{" "}
          <Link className="parent-link" to={`/y/${year}/m/${month}`}>
            {HIJRI_MONTH_NAMES_EN[month - 1]} {year}
          </Link>
        </h1>
        <p className="subtitle text-right">
          {dateLabel}
        </p>
      </div>
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {theDay.getWeekDates().map((date, index) => (
          <div
            className={clsx(
              "p-1 sm:p-2 text-center rounded-md border-1",
              isTodayHijriDate(date) && "bg-gray-200",
              isSameHijriDate(date, theDay)
                ? "border-gray-200"
                : "border-transparent",
            )}
            key={index}
          >
            <Link to={`/y/${date.year}/m/${date.month}/d/${date.day}`}>
              <span className="block text-xs">{date.format("dd")}</span>
              <span className="block text-sm sm:text-base">
                {date.format("DD")}
              </span>
            </Link>
          </div>
        ))}
      </div>
      <div {...handlers}>
        <TextEditor
          instanceID={`${year}-${month}-${date}`}
          content={dayData?.content?.[0] || emptyContent}
          placeholder={placeholder}
          onChange={async (jsonContent) => {
            await saveDayData({
              id: `${year}-${month}-${date}`,
              content: [jsonContent],
              version: 1,
            });
          }}
        />
      </div>
    </div>
  );
}
