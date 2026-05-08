import type { InputMode, EvaluationConfig } from "./types";

export interface Tracker {
  id: string;
  user_id?: string;
  name: string;
  description?: string;
  attributes?: Record<string, string>;
  inputMode: InputMode;
  unit?: string;
  goals?: EvaluationConfig[];
  created_at?: number;
  updated_at?: number;
}

export interface TrackerCreateInput {
  id?: string;
  name: string;
  description?: string;
  attributes?: Record<string, string>;
  inputMode: InputMode;
  unit?: string;
  goals?: EvaluationConfig[];
}

export interface TrackerUpdateInput {
  name?: string;
  description?: string;
  attributes?: Record<string, string>;
  inputMode?: InputMode;
  unit?: string;
  goals?: EvaluationConfig[];
}

export interface TrackerQuery {
  id?: string;
}
