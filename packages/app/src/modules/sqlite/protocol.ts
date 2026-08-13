export type SqliteValue = string | number | null;

// Defined as (payload & { id }) rather than adding `id` directly to each
// variant so callers can build a payload first and attach `id` separately
// (see client.ts) without TS's `Omit<UnionType, "id">` collapsing the
// union down to only its common fields and silently dropping `params`.
export type SqliteRequestPayload =
  | { type: "exec"; sql: string }
  | { type: "run"; sql: string; params?: SqliteValue[] }
  | { type: "wipe" };

export type SqliteRequest = SqliteRequestPayload & { id: number };

export type SqliteResponse =
  | { id: number; ok: true; rows: Record<string, SqliteValue>[] }
  | { id: number; ok: false; error: string };

// Unsolicited (no request `id`) messages the worker pushes about cross-tab
// database lock state — see the Web Locks coordination in worker.ts's
// `waitForDbLock`, which gates bootstrap() until this tab holds the lock.
export type SqliteStatusMessage =
  | { kind: "status"; state: "locked" }
  | { kind: "status"; state: "ready" };

export type SqliteWorkerMessage = SqliteResponse | SqliteStatusMessage;
