import { getCurrentGregorianDate, GREGORIAN_MONTH_NAMES_EN } from "~/lib/gregorian-date";
import DayView from "~/.client/components/day-view";
import {
  HijriDate,
  isSameHijriDate,
  isTodayHijriDate,
} from "~/lib/hijri/hijri-date";
import { Block, Navbar, NavTitle, NavTitleLarge, Page } from "framework7-react";
import { HIJRI_MONTH_NAMES_EN } from "~/lib/hijri-months";
import clsx from "clsx";
import { TextEditor } from "../components/text-editor";
import { useSync } from "~/lib/sync";
import { useDayData } from "../hooks/useDayData";

let emptyContent = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [],
    },
  ],
};

export default function ViewToday() {
  const { replication } = useSync();

  const hijriDate = HijriDate.fromDate(new Date());
  const gregorianDate = hijriDate.toDate();
  const { dayData, saveDayData } = useDayData(
    `${hijriDate.year}-${hijriDate.month}-${hijriDate.day}`,
  );

  const prevDate = hijriDate.previous();
  const nextDate = hijriDate.next();
  const prevLink = `/y/${prevDate.year}/m/${prevDate.month}/d/${prevDate.day}`;
  const nextLink = `/y/${nextDate.year}/m/${nextDate.month}/d/${nextDate.day}`;

  const pageTitle = `${hijriDate.day} ${HIJRI_MONTH_NAMES_EN[hijriDate.month - 1]} ${hijriDate.year}`;
  const subTitle =  `${gregorianDate.getDate()} ${GREGORIAN_MONTH_NAMES_EN[gregorianDate.getMonth()]} ${gregorianDate.getFullYear()}`

  const placeholder = `Write for ${pageTitle}...`;

  return (
    <Page>
      <Navbar>
        <NavTitle subtitle={subTitle}>
          {pageTitle}
        </NavTitle>
      </Navbar>
      <Block>
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {hijriDate.getWeekDates().map((date, index) => (
            <div
              className={clsx(
                "text-center rounded-md border-1",
                isTodayHijriDate(date) && "bg-gray-200",
                isSameHijriDate(date, hijriDate)
                  ? "border-gray-200"
                  : "border-transparent",
              )}
              key={index}
            >
              <div className="text-xs">{date.format("dd")}</div>
              <div className="text-sm sm:text-base">{date.format("DD")}</div>
            </div>
          ))}
        </div>
      </Block>
      <Block>
        <TextEditor
          instanceID={`${hijriDate.year}-${hijriDate.month}-${hijriDate.year}`}
          content={
            dayData?.content ? JSON.parse(dayData.content)[0] : emptyContent
          }
          placeholder={placeholder}
          onChange={debounce(async (jsonContent) => {
            await saveDayData({
              id: `${hijriDate.year}-${hijriDate.month}-${hijriDate.day}`,
              content: JSON.stringify([jsonContent]),
            });
            if (replication?.isPaused() || replication?.isStopped()) {
              replication.reSync();
            }
          }, 500)}
        />
      </Block>
    </Page>
  );
}

function debounce(
  callback: (jsonContent: any) => Promise<void>,
  delay: number,
) {
  let timeout: NodeJS.Timeout;
  return (jsonContent: any) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => callback(jsonContent), delay);
  };
}
