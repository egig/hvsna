import type { PrayerTime, TaskRepeat } from "./types";

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
