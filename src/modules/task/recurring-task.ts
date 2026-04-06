import type { PrayerTime, TaskRepeat } from "./types";

export interface RecurringTask {
  id: string;
  user_id: string;
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
  listId?: string;
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
  listId?: string;
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
  listId?: string;
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
