import { HijriDate } from "../calendar/hijri";

export type TaskStatus = 0 | 1;
export type TaskRepeat = "none" | "daily" | "monthly" | "yearly";
export type PrayerTime =
  | "Fajr"
  | "Sunrise"
  | "Dhuhr"
  | "Asr"
  | "Maghrib"
  | "Isha";

export class Task {
  id?: string;
  rev?: string;
  userId?: string;
  name?: string;
  description?: string;
  status?: TaskStatus;
  atDateIsNone?: number;
  atTimeIsNone?: number;
  atDateHijri?: string;
  atTime?: string;
  atEpochMillis?: number;
  lat?: number;
  long?: number;
  timezone?: string;
  repeat?: TaskRepeat;
  targetId?: string;
  targetValue?: number;
  attributes?: Record<string, string>;
  createdAt?: number;
  updatedAt?: number;
  completedAt?: number;
  prayerTime?: PrayerTime;
  usePrayerTime?: boolean;
  hijriDateOffset?: number;

  constructor(a: Partial<Task>) {
    Object.assign(this, a);
  }

  isOverdue(): boolean {
    if (this.status === 1 || this.completedAt) {
      return false;
    }

    if (!this.atEpochMillis) {
      return false;
    }

    const now = Date.now();
    if (this.atTimeIsNone === 0) {
      return now > this.atEpochMillis;
    }

    // For tasks without specific time, check against end of that calendar day
    const taskDate = new Date(this.atEpochMillis);
    const endOfTaskDay = new Date(taskDate);
    endOfTaskDay.setHours(23, 59, 59, 999); // End of the day

    return now > endOfTaskDay.valueOf();
  }
}

export interface TaskCreateInput {
  name: string;
  description?: string;
  status?: TaskStatus;
  atDateHijri: string;
  atTime?: string;
  lat?: number;
  long?: number;
  timezone?: string;
  repeat?: TaskRepeat;
  targetId?: string;
  targetValue?: number;
  attributes?: Record<string, string>;
  prayerTime?: PrayerTime;
  hijriDateOffset?: number;
}

export interface TaskUpdateInput {
  name?: string;
  description?: string;
  status?: TaskStatus;
  atDateHijri?: string;
  atTime?: string;
  lat?: number;
  long?: number;
  timezone?: string;
  repeat?: TaskRepeat;
  targetId?: string;
  targetValue?: number;
  attributes?: Record<string, string>;
  prayerTime?: PrayerTime;
  hijriDateOffset?: number;
  removeTime?: boolean;
}

export interface TaskChange {
  id: string;
  documentId: string;
  type: "create" | "update" | "delete";
  timestamp: Date;
  data: Task | TaskUpdateInput;
}

export type TaskQuery = {
  status?: TaskStatus;
  targetId?: string;
  atDateHijri?: string;
  atDateIsNone?: number;
  atTimeIsNone?: number;
  atTime?: string;
  atEpochMillis?: number | { $gte?: number; $lte?: number };
  unscheduled?: number;
  searchText?: string;
};
