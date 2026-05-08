export type TaskStatus = 0 | 1 | 2; // 0=pending, 1=completed, 2=logged (tracker tasks only)
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
  trackerId?: string | null;
  attributes?: Record<string, string>;
  createdAt?: number;
  updatedAt?: number;
  completedAt?: number;
  prayerTime?: PrayerTime;
  usePrayerTime?: boolean;
  hijriDateOffset?: number;
  projectId?: string | null = null;
  tags?: string[] | null = null;

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
  trackerId?: string;
  attributes?: Record<string, string>;
  prayerTime?: PrayerTime;
  hijriDateOffset?: number;
  projectId: string | null;
  tags: string[];
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
  trackerId?: string | null;
  attributes?: Record<string, string>;
  prayerTime?: PrayerTime;
  hijriDateOffset?: number;
  removeTime?: boolean;
  projectId?: string | null;
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
  atDateHijri?: string;
  noDate?: number;
  atTime?: string;
  atEpochMillis?: number | { $gte?: number; $lte?: number };
  unscheduled?: number;
  searchText?: string;
  projectId?: string;
  taskType?: TaskTypeFilter;
  tags?: string[];
};

export class Project {
  id?: string;
  rev?: string;
  userId?: string;
  name?: string;
  description?: string;
  color?: string;
  trackerEvaluationRefs?: TrackerEvaluationRef[];
  createdAt?: number;
  updatedAt?: number;

  constructor(a: Partial<Project>) {
    Object.assign(this, a);
  }
}

export interface ProjectCreateInput {
  name: string;
  description?: string;
  color?: string;
  trackerEvaluationRefs?: TrackerEvaluationRef[];
}

export interface ProjectUpdateInput {
  name?: string;
  description?: string;
  color?: string;
  trackerEvaluationRefs?: TrackerEvaluationRef[];
}

export interface ProjectChange {
  id: string;
  documentId: string;
  type: "create" | "update" | "delete";
  timestamp: Date;
  data: Project | ProjectUpdateInput;
}

export interface TrackerEvaluationRef {
  trackerId: string;
  evaluationId: string;
}

export type ProjectQuery = {
  searchText?: string;
};
