import type { HijriDate } from "../calendar/hijri";
import type { TaskRepeat } from "./types";

export interface TaskScheduleAt {
  dateHijri: HijriDate | null;
  time: string;
  prayerTime: string;
}

export type RepeatEnd = "never" | "on_date" | "after_occurrences";

export interface RepeatConfig {
  repeat: TaskRepeat;
  interval: number;
  end: RepeatEnd;
  endDate: string | null;
  endOccurrences: number;
}

export interface TaskFormData {
  scheduleAt: TaskScheduleAt;
  projectId: string;
  repeat: RepeatConfig;
  tags: string[];
}
