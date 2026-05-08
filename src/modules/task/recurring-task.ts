import type { PrayerTime, TaskRepeat } from "./types";
import type {
  InputMode,
  EvaluationConfig,
} from "../../domain/tracker/types";

export interface RecurringTask {
  id: string;
  user_id?: string;
  name: string;
  description?: string;
  attributes?: Record<string, string>;
  repeat: TaskRepeat;
  repeatInterval: number; // e.g. 2 for "every 2 days"
  baseDateHijri: string; // YYYYMMDD — the first occurrence date in Hijri
  atTime?: string;
  prayerTime?: PrayerTime;
  lat?: number;
  long?: number;
  timezone?: string;
  hijriDateOffset?: number;
  projectId?: string;
  tags?: string[];
  repeatEnd?: "never" | "on_date" | "after_occurrences";
  repeatEndDate?: string; // Hijri YYYYMMDD; used when repeatEnd = "on_date"
  repeatEndOccurrences?: number; // used when repeatEnd = "after_occurrences"
  created_at?: number;
  updated_at?: number;
  asTracker?: boolean; // If true, this is a tracker task with logging capabilities
  inputMode?: InputMode; // "toggle" | "add" | "set" — only when asTracker is true
  unit?: string; // Unit for tracker values (e.g., "cups", "kg") — only when asTracker is true
  target?: string; // Target value for tracking goals
  period?: string; // Period for evaluation: "day" | "week" | "month"
  evaluations?: EvaluationConfig[]; // Evaluation configs for future Stage 6
}

export interface RecurringTaskCreateInput {
  id?: string;
  name: string;
  description?: string;
  attributes?: Record<string, string>;
  repeat: TaskRepeat;
  repeatInterval?: number;
  baseDateHijri: string;
  atTime?: string;
  prayerTime?: PrayerTime;
  lat?: number;
  long?: number;
  timezone?: string;
  hijriDateOffset?: number;
  projectId?: string;
  tags?: string[];
  repeatEnd?: "never" | "on_date" | "after_occurrences";
  repeatEndDate?: string;
  repeatEndOccurrences?: number;
  asTracker?: boolean;
  inputMode?: InputMode;
  unit?: string;
  target?: string;
  period?: string;
  evaluations?: EvaluationConfig[];
}

export interface RecurringTaskUpdateInput {
  name?: string;
  description?: string;
  attributes?: Record<string, string>;
  repeat?: TaskRepeat;
  repeatInterval?: number;
  baseDateHijri?: string;
  atTime?: string;
  prayerTime?: PrayerTime;
  lat?: number;
  long?: number;
  timezone?: string;
  hijriDateOffset?: number;
  projectId?: string;
  tags?: string[] | null;
  repeatEnd?: "never" | "on_date" | "after_occurrences";
  repeatEndDate?: string;
  repeatEndOccurrences?: number;
  asTracker?: boolean;
  inputMode?: InputMode;
  unit?: string;
  target?: string;
  period?: string;
  evaluations?: EvaluationConfig[];
}

export interface RecurringTaskChange {
  id: string;
  documentId: string;
  type: "create" | "update" | "delete";
  timestamp: Date;
  data: RecurringTask | RecurringTaskUpdateInput;
}

export type RecurringTaskQuery = {
  id?: string;
  repeat?: TaskRepeat;
};
