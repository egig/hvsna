export type TaskStatus = "pending" | "in_progress" | "completed";

export interface Task {
  id: string;
  user_id: string;
  name: string;
  status: TaskStatus;
  scheduledAt?: number;
  targetId?: string;
  targetValue?: number;
  attributes?: Record<string, string>;
  created_at?: number;
  updated_at?: number;
}

export interface TaskCreateInput {
  id?: string;
  name: string;
  status?: TaskStatus;
  scheduledAt?: number;
  targetId?: string;
  targetValue?: number;
  attributes?: Record<string, string>;
}

export interface TaskUpdateInput {
  name?: string;
  status?: TaskStatus;
  scheduledAt?: number;
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
  id?: string;
  status?: TaskStatus;
};
