export type TaskStatus = 0 | 1;
export type TaskRepeat = "none" | "daily" | "weekly" | "monthly" | "yearly";
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
  noDate?: number;
  atDateHijri?: string;
  atTime?: string;
  atEpochMillis: number | null = null;
  lat?: number;
  long?: number;
  timezone?: string;
  repeat?: TaskRepeat;
  repeatInterval?: number;
  recurringTaskId?: string | null;
  attributes?: Record<string, string>;
  createdAt?: number;
  updatedAt?: number;
  completedAt?: number;
  prayerTime?: PrayerTime;
  usePrayerTime?: boolean;
  hijriDateOffset?: number;
  listId?: string;

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
    return now > this.atEpochMillis;
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
  repeatInterval?: number;
  recurringTaskId?: string;
  attributes?: Record<string, string>;
  prayerTime?: PrayerTime;
  hijriDateOffset?: number;
  listId?: string;
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
  repeatInterval?: number;
  recurringTaskId?: string | null;
  attributes?: Record<string, string>;
  prayerTime?: PrayerTime;
  hijriDateOffset?: number;
  removeTime?: boolean;
  listId?: string | null;
}

export interface TaskChange {
  id: string;
  documentId: string;
  type: "create" | "update" | "delete";
  timestamp: Date;
  data: Task | TaskUpdateInput;
}

export type TaskTypeFilter = "all" | "recurring";

export type TaskQuery = {
  status?: TaskStatus;
  atDateHijri?: string;
  noDate?: number;
  atTime?: string;
  atEpochMillis?: number | { $gte?: number; $lte?: number };
  unscheduled?: number;
  searchText?: string;
  listId?: string;
  taskType?: TaskTypeFilter;
};

export class List {
  id?: string;
  rev?: string;
  userId?: string;
  name?: string;
  description?: string;
  color?: string;
  createdAt?: number;
  updatedAt?: number;

  constructor(a: Partial<List>) {
    Object.assign(this, a);
  }
}

export interface ListCreateInput {
  name: string;
  description?: string;
  color?: string;
}

export interface ListUpdateInput {
  name?: string;
  description?: string;
  color?: string;
}

export interface ListChange {
  id: string;
  documentId: string;
  type: "create" | "update" | "delete";
  timestamp: Date;
  data: List | ListUpdateInput;
}

export type ListQuery = {
  searchText?: string;
};
