import type { TaskRecurringType } from "@/domain/task";

export interface RecurringTask {
  id: string;
  user_id?: string;
  name: string;
  description?: string;
  recurringType: TaskRecurringType;
  recurringInterval: number;
  baseDateEpoch: number;
  atTime?: string;
  lat?: number;
  long?: number;
  timezone?: string;
  hijriDateOffset?: number;
  tags?: string[];
  recurringEnd?: "never" | "on_date" | "after_occurrences";
  recurringEndEpoch?: number;
  recurringEndOccurrences?: number;
  useGregorian?: boolean;
  occurrenceExceptions?: string[];
  created_at?: number;
  updated_at?: number;
}

export interface RecurringTaskCreateInput {
  id?: string;
  name: string;
  description?: string;
  recurringType: TaskRecurringType;
  recurringInterval?: number;
  baseDateEpoch: number;
  atTime?: string;
  lat?: number;
  long?: number;
  timezone?: string;
  hijriDateOffset?: number;
  tags?: string[];
  recurringEnd?: "never" | "on_date" | "after_occurrences";
  recurringEndEpoch?: number;
  recurringEndOccurrences?: number;
  useGregorian?: boolean;
}

export interface RecurringTaskUpdateInput {
  name?: string;
  description?: string;
  recurringType?: TaskRecurringType;
  recurringInterval?: number;
  baseDateEpoch?: number;
  atTime?: string;
  lat?: number;
  long?: number;
  timezone?: string;
  hijriDateOffset?: number;
  tags?: string[] | null;
  recurringEnd?: "never" | "on_date" | "after_occurrences";
  recurringEndEpoch?: number;
  recurringEndOccurrences?: number;
  useGregorian?: boolean;
  occurrenceExceptions?: string[];
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
  recurringType?: TaskRecurringType;
};
