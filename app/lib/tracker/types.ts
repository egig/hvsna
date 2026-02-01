/* ============================================================
   Universal Tracker – Entity Types
   ============================================================ */

/* ---------- Common ---------- */

export type UUID = string;

export type EpochTime = number;

export interface TrackerAttribute {
  id: string;
  name: string;
  type: "text" | "number" | "date" | "select";
  required?: boolean;
  options?: string[]; // for select type
  defaultValue?: string | number;
}

/* ---------- Log ---------- */
/**
 * Append-only signal.
 * All state is derived from logs.
 */
export interface Log {
  id: UUID;
  trackerId: UUID;
  timestamp: EpochTime;
  value: number;
  attributes?: Record<string, unknown>;
  createdAt: EpochTime;
  negative?: boolean;
}

/* ---------- Target ---------- */

export type TargetReducer = "sum" | "count" | "last" | "avg" | "min" | "max";
export type TargetCalculation =
  | "sum"
  | "count"
  | "last"
  | "avg"
  | "min"
  | "max";

export type TargetDirection = "increase" | "decrease" | "neutral";

/**
 * Unifies goal, budget, quota, SLA, limit.
 */
export interface Target {
  id: UUID;
  name: string;
  trackerId: UUID;
  type: TargetType;
  calculation: TargetCalculation;
  direction: TargetDirection;
  value: number; // target or min
  valueMax?: number; // only for range
  period?: TargetPeriod;
  scope: string[]; // list of attributeId
  createdAt: EpochTime;
}

export type TargetType = "static" | "range";

export type TargetPeriod =
  | "log"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "total";

/* ---------- Aggregation Cache ---------- */
/**
 * Derived data only.
 * Never source of truth.
 */
export interface AggregationCache {
  trackerId: UUID;
  periodStart: EpochTime;
  periodEnd: EpochTime;
  value: number;
  computedAt: EpochTime;
}

/* ============================================================
   Invariants (Design Contract)
   ============================================================ */

/**
 * - Logs are immutable
 * - Trackers define math, not UI
 * - Evaluations judge aggregated values
 * - All progress, streaks, balances are derived
 */
