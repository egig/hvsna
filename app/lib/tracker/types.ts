/* ============================================================
   Universal Tracker – Entity Types
   ============================================================ */

/* ---------- Common ---------- */

export type UUID = string

export type EpochTime = number

/* ---------- Tracker ---------- */
/**
 * Defines how values behave mathematically.
 * Replaces "tracker", "expense", "goal", etc.
 */
export interface Tracker {
  id: UUID
  name: string
  unit: string                 // IDR, count, hours, %, kg
  reducer: TrackerReducer
  direction: TrackerDirection
  baseline: number
  createdAt: EpochTime
}

export type TrackerReducer =
  | 'sum'
  | 'count'
  | 'last'
  | 'avg'
  | 'min'
  | 'max'

export type TrackerDirection =
  | 'increase'
  | 'decrease'
  | 'neutral'

/* ---------- Log ---------- */
/**
 * Append-only signal.
 * All state is derived from logs.
 */
export interface Log {
  id: UUID
  trackerId: UUID
  timestamp: EpochTime
  value: number
  metadata?: Record<string, unknown>
  createdAt: EpochTime
}

/* ---------- Evaluation ---------- */
/**
 * Unifies goal, budget, quota, SLA, limit.
 */
export interface Evaluation {
  id: UUID
  trackerId: UUID
  type: EvaluationType
  value: number                // target or min
  valueMax?: number             // only for range
  period?: EvaluationPeriod
  soft: boolean
  createdAt: EpochTime
}

export type EvaluationType =
  | 'static'
  | 'range'

export type EvaluationPeriod =
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'total'

/* ---------- Category ---------- */

export interface Category {
  id: UUID
  name: string
  createdAt: EpochTime
}

/* ---------- LogCategory (Join) ---------- */

export interface LogCategory {
  logId: UUID
  categoryId: UUID
}

/* ---------- Aggregation Cache ---------- */
/**
 * Derived data only.
 * Never source of truth.
 */
export interface AggregationCache {
  trackerId: UUID
  periodStart: EpochTime
  periodEnd: EpochTime
  value: number
  computedAt: EpochTime
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
