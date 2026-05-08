import type { InputMode, EvaluationConfig } from "./types";

export interface Tracker {
  id: string;
  user_id?: string;
  name: string;
  description?: string;
  attributes?: Record<string, string>;
  repeat: string;
  repeatInterval: number;
  baseDateHijri: string;
  atTime?: string;
  prayerTime?: string;
  lat?: number;
  long?: number;
  timezone?: string;
  hijriDateOffset?: number;
  projectId?: string;
  tags?: string[];
  repeatEnd?: "never" | "on_date" | "after_occurrences";
  repeatEndDate?: string;
  repeatEndOccurrences?: number;
  created_at?: number;
  updated_at?: number;
  asTracker: true;
  inputMode: InputMode;
  unit?: string;
  target?: string;
  period?: string;
  evaluations?: EvaluationConfig[];
}

export interface TrackerCreateInput {
  id?: string;
  name: string;
  description?: string;
  attributes?: Record<string, string>;
  repeat: string;
  repeatInterval?: number;
  baseDateHijri: string;
  atTime?: string;
  prayerTime?: string;
  lat?: number;
  long?: number;
  timezone?: string;
  hijriDateOffset?: number;
  projectId?: string;
  tags?: string[];
  repeatEnd?: "never" | "on_date" | "after_occurrences";
  repeatEndDate?: string;
  repeatEndOccurrences?: number;
  asTracker: true;
  inputMode: InputMode;
  unit?: string;
  target?: string;
  period?: string;
  evaluations?: EvaluationConfig[];
}

export interface TrackerUpdateInput {
  name?: string;
  description?: string;
  attributes?: Record<string, string>;
  repeat?: string;
  repeatInterval?: number;
  baseDateHijri?: string;
  atTime?: string;
  prayerTime?: string;
  lat?: number;
  long?: number;
  timezone?: string;
  hijriDateOffset?: number;
  projectId?: string;
  tags?: string[] | null;
  repeatEnd?: "never" | "on_date" | "after_occurrences";
  repeatEndDate?: string;
  repeatEndOccurrences?: number;
  inputMode?: InputMode;
  unit?: string;
  target?: string;
  period?: string;
  evaluations?: EvaluationConfig[];
}

export interface TrackerQuery {
  id?: string;
  repeat?: string;
}
