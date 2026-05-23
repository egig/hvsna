import type { HijriDate } from "../calendar/hijri";
import type { TaskRepeat } from "@/domain/task";

export interface TaskScheduleAt {
  dateHijri: HijriDate | null;
  time: string;
}

export type RepeatEnd = "never" | "on_date" | "after_occurrences";

export interface RepeatConfig {
  repeat: TaskRepeat;
  interval: number;
  end: RepeatEnd;
  endDate: string | null;
  endOccurrences: number;
  useGregorian: boolean;
}

export interface TaskFormData {
  scheduleAt: TaskScheduleAt;
  repeat: RepeatConfig;
  tags: string[];
}
