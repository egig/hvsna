import type { PrayerTime, TaskRepeat } from "@/domain/task";

export interface RecurringTask {
  id: string;
  user_id?: string;
  name: string;
  description?: string;
  repeat: TaskRepeat;
  repeatInterval: number;
  baseDateEpoch: number;
  atTime?: string;
  lat?: number;
  long?: number;
  timezone?: string;
  hijriDateOffset?: number;
  tags?: string[];
  repeatEnd?: "never" | "on_date" | "after_occurrences";
  repeatEndEpoch?: number;
  repeatEndOccurrences?: number;
  created_at?: number;
  updated_at?: number;
}

export interface RecurringTaskCreateInput {
  id?: string;
  name: string;
  description?: string;
  repeat: TaskRepeat;
  repeatInterval?: number;
  baseDateEpoch: number;
  atTime?: string;
  lat?: number;
  long?: number;
  timezone?: string;
  hijriDateOffset?: number;
  tags?: string[];
  repeatEnd?: "never" | "on_date" | "after_occurrences";
  repeatEndEpoch?: number;
  repeatEndOccurrences?: number;
}

export interface RecurringTaskUpdateInput {
  name?: string;
  description?: string;
  attributes?: Record<string, string>;
  repeat?: TaskRepeat;
  repeatInterval?: number;
  baseDateEpoch?: number;
  atTime?: string;
  lat?: number;
  long?: number;
  timezone?: string;
  hijriDateOffset?: number;
  tags?: string[] | null;
  repeatEnd?: "never" | "on_date" | "after_occurrences";
  repeatEndEpoch?: number;
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
