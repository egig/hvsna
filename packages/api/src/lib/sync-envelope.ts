import type { SyncEntityRow } from "@/db/schema";

/**
 * Entity types are open-ended: any wire table key matching this pattern is
 * accepted, so a client can start syncing a new type without a server
 * change. Kept to a pattern (not an allow-list) on purpose.
 */
export const ENTITY_TYPE_PATTERN = /^[a-z_]{1,32}$/;

/**
 * Types every push/pull response reports, even when the request didn't
 * mention them — shipped clients deserialize all four as required fields
 * (see SyncPushResponse/SyncPullResponse in android/.../sync/SyncTypes.kt).
 */
export const ALWAYS_REPORTED_TYPES = ["tasks", "recurring_tasks", "settings", "tags"] as const;

/** The wire field holding a row's id — `id` unless listed here. */
const ID_FIELDS: Record<string, string> = { settings: "key" };

export function idFieldFor(entityType: string): string {
  return ID_FIELDS[entityType] ?? "id";
}

/** Wire fields stored in their own columns, never inside `payload`. */
export function envelopeFieldsFor(entityType: string): string[] {
  return [idFieldFor(entityType), "updated_at", "deleted_at", "rev"];
}

type StoredRow = Pick<SyncEntityRow, "entityType" | "id" | "payload" | "updatedAt" | "deletedAt" | "rev">;

/**
 * Reassembles a stored row into the flat wire shape clients expect —
 * payload fields plus the envelope, which always wins over a same-named
 * payload key.
 */
export function toWireRow(row: StoredRow): Record<string, unknown> {
  return {
    ...row.payload,
    [idFieldFor(row.entityType)]: row.id,
    updated_at: row.updatedAt,
    deleted_at: row.deletedAt,
    rev: row.rev,
  };
}
