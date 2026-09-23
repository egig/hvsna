/**
 * Wire shapes for /sync/push and /sync/pull. The server treats every row as
 * an envelope (id, updated_at, deleted_at, rev) plus opaque client-owned
 * fields, so these types describe only the envelope — the per-entity field
 * lists live on the clients (packages/app/src/infra/sync/types.ts,
 * android/.../sync/SyncTypes.kt).
 */

/** A pushed row after envelope validation, ready to upsert. */
export interface SyncPushRow {
  id: string;
  updatedAt: number;
  deletedAt: number | null;
  /** Every non-envelope wire field of the row. */
  payload: Record<string, unknown>;
}

/** Validated push rows keyed by entity type (the wire table key, e.g. `tasks`). */
export type SyncPushBatch = Map<string, SyncPushRow[]>;

/**
 * `id` identifies the row's primary key value regardless of what that
 * field is called on the wire (e.g. settings' `key`) — kept uniform across
 * types so the client's push-result handling stays generic.
 */
export interface SyncPushTableResult {
  applied: string[];
  rejected: { id: string; server_row: Record<string, unknown> }[];
}

export type SyncPushResponse = Record<string, SyncPushTableResult>;

export interface SyncPullTableResult {
  rows: Record<string, unknown>[];
  next_cursor: number;
  has_more: boolean;
}

export type SyncPullResponse = Record<string, SyncPullTableResult>;
