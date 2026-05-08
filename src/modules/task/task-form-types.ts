import type { HijriDate } from "../calendar/hijri";
import type { TaskRepeat } from "./types";
import type { InputMode, EvaluationConfig } from "../../domain/tracker/types";

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
  trackerId?: string; // Reference to the Tracker entity if tracking is enabled
  showGoalSettings: boolean; // If true, show goal settings for tracker
  inputMode?: InputMode; // "toggle" | "add" | "set" — only when creating tracker
  unit?: string; // Unit for tracker values (e.g., "cups", "kg")
  goalTarget?: string; // Target value for tracking goals
  goalPeriod?: string; // Period for evaluation: "day" | "week" | "month"
}
