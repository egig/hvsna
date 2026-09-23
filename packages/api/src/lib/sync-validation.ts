import { ApiError } from "./response";
import { ENTITY_TYPE_PATTERN, envelopeFieldsFor, idFieldFor } from "./sync-envelope";
import type { SyncPushBatch, SyncPushRow } from "./sync-types";

export const MAX_SYNC_BATCH_SIZE = 500;
export const MAX_ENTITY_TYPES = 16;
export const MAX_ID_LENGTH = 255;
export const MAX_PAYLOAD_BYTES = 64 * 1024;

function invalid(message: string): never {
  throw new ApiError(400, "INVALID_REQUEST", message);
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

export function assertEntityType(entityType: string): void {
  if (!ENTITY_TYPE_PATTERN.test(entityType)) {
    invalid(`"${entityType}" is not a valid entity type`);
  }
}

export function assertEntityTypeCount(count: number): void {
  if (count > MAX_ENTITY_TYPES) {
    invalid(`A request may name at most ${MAX_ENTITY_TYPES} entity types`);
  }
}

/**
 * Checks only the envelope — the server never interprets the rest of a row,
 * which is what lets clients add fields without a server change. Everything
 * outside the envelope becomes the row's `payload`.
 */
function validateRow(entityType: string, raw: unknown, index: number): SyncPushRow {
  const at = `${entityType}[${index}]`;
  if (!isPlainObject(raw)) invalid(`${at} must be an object`);

  const idField = idFieldFor(entityType);
  const id = raw[idField];
  if (typeof id !== "string" || id.length === 0 || id.length > MAX_ID_LENGTH) {
    invalid(`${at}.${idField} must be a non-empty string of at most ${MAX_ID_LENGTH} characters`);
  }
  const updatedAt = raw.updated_at;
  if (!isNumber(updatedAt)) invalid(`${at}.updated_at is missing or has the wrong type`);
  const deletedAt = raw.deleted_at ?? null;
  if (deletedAt !== null && !isNumber(deletedAt)) {
    invalid(`${at}.deleted_at has the wrong type`);
  }

  const payload: Record<string, unknown> = { ...raw };
  for (const field of envelopeFieldsFor(entityType)) delete payload[field];
  if (Buffer.byteLength(JSON.stringify(payload)) > MAX_PAYLOAD_BYTES) {
    invalid(`${at} exceeds the ${MAX_PAYLOAD_BYTES}-byte payload limit`);
  }

  return { id, updatedAt, deletedAt, payload };
}

/**
 * Collapses repeated ids to the newest version (last one wins a tie) —
 * Postgres refuses an upsert that touches the same row twice.
 */
function dedupeById(rows: SyncPushRow[]): SyncPushRow[] {
  const byId = new Map<string, SyncPushRow>();
  for (const row of rows) {
    const existing = byId.get(row.id);
    if (!existing || row.updatedAt >= existing.updatedAt) byId.set(row.id, row);
  }
  return [...byId.values()];
}

/** Validates a /sync/push body: each top-level key is an entity type holding an array of rows. */
export function validatePushBody(body: Record<string, unknown>): SyncPushBatch {
  const entries = Object.entries(body).filter(([, rows]) => rows !== undefined && rows !== null);
  assertEntityTypeCount(entries.length);

  const batch: SyncPushBatch = new Map();
  for (const [entityType, rows] of entries) {
    assertEntityType(entityType);
    if (!Array.isArray(rows)) invalid(`${entityType} must be an array`);
    if (rows.length > MAX_SYNC_BATCH_SIZE) {
      invalid(`${entityType} batch exceeds the ${MAX_SYNC_BATCH_SIZE}-row limit`);
    }
    batch.set(entityType, dedupeById(rows.map((row, i) => validateRow(entityType, row, i))));
  }
  return batch;
}
