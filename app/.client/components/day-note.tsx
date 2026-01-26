import type { HijriDate } from "~/lib/hijri";
import { useDayNote } from "../hooks/useDayNote";
import { TextEditor } from "./text-editor";

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
  const { dayData, saveDayData } = useDayNote(dayNoteId);

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
