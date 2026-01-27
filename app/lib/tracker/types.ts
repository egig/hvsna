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
  baseline: number
  createdAt: EpochTime
}

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

/* ---------- Target ---------- */

export type TargetReducer =
  | 'sum'
  | 'count'
  | 'last'
  | 'avg'
  | 'min'
  | 'max'

export type TargetDirection =
  | 'increase'
  | 'decrease'
  | 'neutral'

/**
 * Unifies goal, budget, quota, SLA, limit.
 */
export interface Target {
  id: UUID
  trackerId: UUID
  type: TargetType
  reducer: TargetReducer
  direction: TargetDirection
  value: number                // target or min
  valueMax?: number             // only for range
  period?: TargetPeriod
  soft: boolean
  createdAt: EpochTime
}

export type TargetType =
  | 'static'
  | 'range'

export type TargetPeriod =
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
