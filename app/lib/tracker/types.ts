/* ============================================================
   Universal Tracker – Entity Types
   ============================================================ */

/* ---------- Common ---------- */

export type UUID = string

export type EpochTime = number

/* ---------- Metric ---------- */
/**
 * Defines how values behave mathematically.
 * Replaces "tracker", "expense", "goal", etc.
 */
export interface Metric {
  id: UUID
  name: string
  unit: string                 // IDR, count, hours, %, kg
  reducer: MetricReducer
  direction: MetricDirection
  baseline: number
  createdAt: EpochTime
}

export type MetricReducer =
  | 'sum'
  | 'count'
  | 'last'
  | 'avg'
  | 'min'
  | 'max'

export type MetricDirection =
  | 'increase'
  | 'decrease'
  | 'neutral'

/* ---------- Event ---------- */
/**
 * Append-only signal.
 * All state is derived from events.
 */
export interface Event {
  id: UUID
  metricId: UUID
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
  metricId: UUID
  type: EvaluationType
  value: number                // target or min
  valueMax?: number             // only for range
  period?: EvaluationPeriod
  soft: boolean
  createdAt: EpochTime
}

export type EvaluationType =
  | 'target'
  | 'range'
  | 'threshold'

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

/* ---------- EventCategory (Join) ---------- */

export interface EventCategory {
  eventId: UUID
  categoryId: UUID
}

/* ---------- Aggregation Cache ---------- */
/**
 * Derived data only.
 * Never source of truth.
 */
export interface AggregationCache {
  metricId: UUID
  periodStart: EpochTime
  periodEnd: EpochTime
  value: number
  computedAt: EpochTime
}

/* ============================================================
   Invariants (Design Contract)
   ============================================================ */

/**
 * - Events are immutable
 * - Metrics define math, not UI
 * - Evaluations judge aggregated values
 * - All progress, streaks, balances are derived
 */
