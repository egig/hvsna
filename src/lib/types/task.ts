export type TaskStatus = "pending" | "in_progress" | "completed";
export type TaskRepeat = "none" | "daily" | "monthly" | "yearly";

export interface Task {
  id: string;
  userId?: string;
  name: string;
  status: TaskStatus;
  scheduledAt?: number;
  repeat?: TaskRepeat;
  targetId?: string;
  hijriDate?: string;
  hour?: number;
  minute?: number;
  lat?: number;
  long?: number;
  timezone?: string;
  targetValue?: number;
  attributes?: Record<string, string>;
  createdAt?: number;
  updatedAt?: number;
}

export interface TaskCreateInput {
  id?: string;
  name: string;
  status?: TaskStatus;
  scheduledAt?: number;
  repeat?: TaskRepeat;
  targetId?: string;
  targetValue?: number;
  attributes?: Record<string, string>;
  hijriDate: string;
  hour?: number;
  minute?: number;
  lat?: number;
  long?: number;
}

export interface TaskUpdateInput {
  name?: string;
  status?: TaskStatus;
  scheduledAt?: number;
  repeat?: TaskRepeat;
  targetId?: string;
  targetValue?: number;
  attributes?: Record<string, string>;
  hijriDate?: string;

  hour?: number;
  minute?: number;
  lat?: number;
  long?: number;
}

export interface TaskChange {
  id: string;
  documentId: string;
  type: "create" | "update" | "delete";
  timestamp: Date;
  data: Task | TaskUpdateInput;
}

export type TaskQuery = {
  id?: string;
  status?: TaskStatus;
};
