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
  note?: string;
}

/* ---------- Goal ---------- */

export type GoalReducer = "sum" | "count" | "last" | "avg" | "min" | "max";
export type GoalCalculation = "sum" | "count" | "last" | "avg" | "min" | "max";

export type GoalDirection = "increase" | "decrease" | "neutral";

/**
 * Unifies goal, budget, quota, SLA, limit.
 */
export interface Goal {
  id: UUID;
  name: string;
  trackerId: UUID;
  type: GoalType;
  calculation: GoalCalculation;
  direction: GoalDirection;
  value: number; // goal or min
  valueMax?: number; // only for range
  period?: GoalPeriod;
  scope: string[]; // list of attributeId
  createdAt: EpochTime;
}

export type GoalType = "static" | "range";

export type GoalPeriod =
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
