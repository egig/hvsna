export type TaskStatus = "pending" | "in_progress" | "completed";
export type TaskRepeat = "none" | "daily" | "monthly" | "yearly";

export interface Task {
  id: string;
  userId?: string;
  name: string;
  description?: string;
  status: TaskStatus;
  scheduledAtEpochMillis?: number;
  repeat?: TaskRepeat;
  targetId?: string;
  hijriDate?: string;
  hijriDateYear?: number;
  hijriDateMonth?: number;
  hijriDateDay?: number;
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
  name: string;
  description?: string;
  status?: TaskStatus;
  hijriDate: string;
  hijriDateYear?: number;
  hijriDateMonth?: number;
  hijriDateDay?: number;
  hour?: number;
  minute?: number;
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
  hijriDate?: string;
  hijriDateYear?: number;
  hijriDateMonth?: number;
  hijriDateDay?: number;
  hour?: number;
  minute?: number;
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
  hijriDateYear?: number;
  hijriDateMonth?: number;
  hijriDateDay?: number;
  scheduledAtEpochMillis?: number;
};
