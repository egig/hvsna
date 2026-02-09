export type TaskStatus = 0 | 1;
export type TaskRepeat = "none" | "daily" | "monthly" | "yearly";

export interface Task {
  id: string;
  userId?: string;
  name: string;
  description?: string;
  status: TaskStatus;
  scheduledAtDateIsNone: number;
  scheduledAtTimeIsNone: number;
  scheduledAtDateHijri?: string;
  scheduledAtTime?: string;
  scheduledAtEpochMillis?: number;
  targetId?: string;
  lat?: number;
  long?: number;
  timezone?: string;
  repeat?: TaskRepeat;
  targetValue?: number;
  attributes?: Record<string, string>;
  createdAt?: number;
  updatedAt?: number;
}

export interface TaskCreateInput {
  name: string;
  description?: string;
  status?: TaskStatus;
  scheduledAtDateHijri: string;
  scheduledAtTimeIsNone?: number;
  scheduledAtTime?: string;
  lat?: number;
  long?: number;
  repeat?: TaskRepeat;
  targetId?: string;
  targetValue?: number;
  attributes?: Record<string, string>;
}

export interface TaskUpdateInput {
  name?: string;
  description?: string;
  status?: TaskStatus;
  scheduledAtDateHijri?: string;
  scheduledAtDateIsNone?: boolean;
  scheduledAtTimeIsNone?: boolean;
  scheduledAtTime?: string;
  lat?: number;
  long?: number;
  repeat?: TaskRepeat;
  targetId?: string;
  targetValue?: number;
  attributes?: Record<string, string>;
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
  scheduledAtDateHijri?: string;
  scheduledAtDateIsNone?: boolean;
  scheduledAtTimeIsNone?: boolean;
  scheduledAtTime?: string;
  unscheduled?: number;
  searchText?: string;
};
