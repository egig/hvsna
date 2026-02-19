import type { HijriDate } from "src/modules/calendar/hijri";
import { Editor } from "src/lib/editor";
import { useDayNote } from "./useDayNote";

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
  const dayNoteId = date.format("YYYYMMDD");
  const { dayData, saveDayData } = useDayNote(dayNoteId);

  const placeholder = `Write for this day...`;

  return (
    <div className="p-4">
      <Editor
        content={dayData?.content ? dayData.content[0] : emptyContent}
        onUpdate={debounce(async (content) => {
          console.log(content);
          await saveDayData({ content: [content] });
        }, 500)}
      />
    </div>
  );
}

function debounce(
  callback: (jsonContent: any) => Promise<void>,
  delay: number,
) {
  let timeout: NodeJS.Timeout;
  return (jsonContent: any) => {
    clearTimeout(timeout);
    timeout = setTimeout(async () => await callback(jsonContent), delay);
  };
}
