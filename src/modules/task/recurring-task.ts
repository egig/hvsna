import type { TaskRepeat } from "./task";

export interface RecurringTask {
  id: string;
  user_id: string;
  name: string;
  targetId?: string;
  targetValue?: number;
  attributes?: Record<string, string>;
  repeat: TaskRepeat;
  baseDate: number; // The original scheduled date to base repetitions on
  created_at?: number;
  updated_at?: number;
}

export interface RecurringTaskCreateInput {
  id?: string;
  name: string;
  targetId?: string;
  targetValue?: number;
  attributes?: Record<string, string>;
  repeat: TaskRepeat;
  baseDate: number;
}

export interface RecurringTaskUpdateInput {
  name?: string;
  targetId?: string;
  targetValue?: number;
  attributes?: Record<string, string>;
  repeat?: TaskRepeat;
  baseDate?: number;
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
