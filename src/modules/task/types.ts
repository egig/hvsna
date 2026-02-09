export type TaskStatus = 0 | 1;
export type TaskRepeat = "none" | "daily" | "monthly" | "yearly";

export interface Task {
  id: string;
  userId?: string;
  name: string;
  description?: string;
  status: TaskStatus;
  atDateIsNone: number;
  atTimeIsNone: number;
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
}

export interface TaskCreateInput {
  name: string;
  description?: string;
  status?: TaskStatus;
  atDateHijri: string;
  atTimeIsNone?: number;
  atTime?: string;
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
  atDateHijri?: string;
  atDateIsNone?: number;
  atTimeIsNone?: number;
  atTime?: string;
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
  atDateHijri?: string;
  atDateIsNone?: number;
  atTimeIsNone?: number;
  atTime?: string;
  unscheduled?: number;
  searchText?: string;
};
