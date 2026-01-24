import type { HijriDate } from "~/lib/hijri";
import { useDayData } from "../hooks/useDayData";
import { TextEditor } from "./text-editor";
import { useSync } from "~/lib/sync";

let emptyContent = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [],
    },
  ],
};

export default function DayNote({ date }: { date: HijriDate }) {
  const { replication } = useSync();
  const { dayData, saveDayData } = useDayData(
    `${date.year}-${date.month}-${date.day}`,
  );

  const placeholder = `Write for this day...`;

  return (
    <TextEditor
      instanceID={`${date.year}-${date.month}-${date.day}`}
      content={dayData?.content ? JSON.parse(dayData.content)[0] : emptyContent}
      placeholder={placeholder}
      onChange={debounce(async (jsonContent) => {
        await saveDayData({
          id: `${date.year}-${date.month}-${date.day}`,
          content: JSON.stringify([jsonContent]),
        });
        if (replication?.isPaused() || replication?.isStopped()) {
          replication.reSync();
        }
      }, 500)}
    />
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
