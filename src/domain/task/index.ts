export type TaskStatus = 0 | 1;
export type TaskRecurringType =
  | "none"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly";
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
  name?: string;
  description?: string;
  status?: TaskStatus;
  atTime?: string;
  atEpochMillis: number | null = null;
  lat?: number;
  long?: number;
  timezone?: string;
  recurringType?: TaskRecurringType;
  recurringInterval?: number;
  recurringTaskId?: string | null;
  hijriDateOffset?: number;
  tags?: string[] | null = null;
  createdAt?: number;
  updatedAt?: number;
  completedAt?: number;
  deletedAt?: number;
  isVirtual?: boolean;

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
  atEpochMillis?: number | null;
  atTime?: string;
  lat?: number;
  long?: number;
  timezone?: string;
  recurringType?: TaskRecurringType;
  recurringInterval?: number;
  recurringTaskId?: string;
  hijriDateOffset?: number;
  tags: string[];
}

export interface TaskUpdateInput {
  name?: string;
  description?: string;
  status?: TaskStatus;
  atEpochMillis?: number | null;
  atTime?: string;
  lat?: number;
  long?: number;
  timezone?: string;
  recurringType?: TaskRecurringType;
  recurringInterval?: number;
  recurringTaskId?: string | null;
  hijriDateOffset?: number;
  removeTime?: boolean;
  tags?: string[] | null;
  logEntries?: { value: number; note?: string; occurredAt: number }[];
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
  atTime?: string;
  atEpochMillis?: number | { $gte?: number; $lte?: number };
  unscheduled?: number;
  searchText?: string;
  taskType?: TaskTypeFilter;
  tags?: string[];
};
