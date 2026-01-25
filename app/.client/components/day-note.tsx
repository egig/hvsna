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
  const dayNoteId = date.format("YYYYMMDD")
  const { dayData, saveDayData } = useDayData(dayNoteId);

  const placeholder = `Write for this day...`;

  return (
    <TextEditor
      instanceID={dayNoteId}
      content={dayData?.content ? dayData.content[0] : emptyContent}
      placeholder={placeholder}
      onChange={debounce(async (jsonContent) => {
        await saveDayData({
          content: [jsonContent],
        });
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
