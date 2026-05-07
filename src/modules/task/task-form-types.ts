import type { HijriDate } from "../calendar/hijri";
import type { TaskRepeat } from "./types";
import type { InputMode } from "../../domain/tracker/ITrackerRepository";

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
  asTracker: boolean; // If true, this is a tracker task with logging capabilities
  inputMode?: InputMode; // "toggle" | "add" | "set" — only when asTracker is true
  unit?: string; // Unit for tracker values (e.g., "cups", "kg") — only when asTracker is true
  target?: string; // Target value for tracking goals
  period?: string; // Period for evaluation: "day" | "week" | "month"
}
