import { ApiError } from "./response";
import type {
  RecurringTaskPushRow,
  SettingsPushRow,
  TaskPushRow,
} from "./sync-types";

export const MAX_SYNC_BATCH_SIZE = 500;

function isString(v: unknown): v is string {
  return typeof v === "string";
}

function isNullableString(v: unknown): v is string | null {
  return v === null || v === undefined || typeof v === "string";
}

function isNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function isNullableNumber(v: unknown): v is number | null {
  return v === null || v === undefined || isNumber(v);
}

function invalid(entityType: string, index: number, field: string): never {
  throw new ApiError(
    400,
    "INVALID_REQUEST",
    `${entityType}[${index}].${field} is missing or has the wrong type`
  );
}

function assertBatchSize(entityType: string, rows: unknown[]): void {
  if (rows.length > MAX_SYNC_BATCH_SIZE) {
    throw new ApiError(
      400,
      "INVALID_REQUEST",
      `${entityType} batch exceeds the ${MAX_SYNC_BATCH_SIZE}-row limit`
    );
  }
}

export function validateTaskRows(input: unknown): TaskPushRow[] {
  if (input === undefined) return [];
  if (!Array.isArray(input)) throw new ApiError(400, "INVALID_REQUEST", "tasks must be an array");
  assertBatchSize("tasks", input);

  return input.map((raw, i) => {
    const row = raw as Record<string, unknown>;
    if (!isString(row.id)) invalid("tasks", i, "id");
    if (!isString(row.name)) invalid("tasks", i, "name");
    if (!isNullableString(row.description)) invalid("tasks", i, "description");
    if (!isNumber(row.status)) invalid("tasks", i, "status");
    if (!isNullableString(row.at_time)) invalid("tasks", i, "at_time");
    if (!isNullableNumber(row.at_epoch_millis)) invalid("tasks", i, "at_epoch_millis");
    if (!isNullableNumber(row.lat)) invalid("tasks", i, "lat");
    if (!isNullableNumber(row.lng)) invalid("tasks", i, "lng");
    if (!isNullableString(row.timezone)) invalid("tasks", i, "timezone");
    if (!isNullableString(row.recurring_type)) invalid("tasks", i, "recurring_type");
    if (!isNullableNumber(row.recurring_interval)) invalid("tasks", i, "recurring_interval");
    if (!isNullableString(row.recurring_task_id)) invalid("tasks", i, "recurring_task_id");
    if (!isNullableNumber(row.hijri_date_offset)) invalid("tasks", i, "hijri_date_offset");
    if (!isNullableString(row.tags)) invalid("tasks", i, "tags");
    if (!isNumber(row.created_at)) invalid("tasks", i, "created_at");
    if (!isNumber(row.updated_at)) invalid("tasks", i, "updated_at");
    if (!isNullableNumber(row.completed_at)) invalid("tasks", i, "completed_at");
    if (!isNullableNumber(row.deleted_at)) invalid("tasks", i, "deleted_at");

    return {
      id: row.id,
      name: row.name,
      description: (row.description ?? null) as string | null,
      status: row.status,
      at_time: (row.at_time ?? null) as string | null,
      at_epoch_millis: (row.at_epoch_millis ?? null) as number | null,
      lat: (row.lat ?? null) as number | null,
      lng: (row.lng ?? null) as number | null,
      timezone: (row.timezone ?? null) as string | null,
      recurring_type: (row.recurring_type ?? null) as string | null,
      recurring_interval: (row.recurring_interval ?? null) as number | null,
      recurring_task_id: (row.recurring_task_id ?? null) as string | null,
      hijri_date_offset: (row.hijri_date_offset ?? null) as number | null,
      tags: (row.tags ?? null) as string | null,
      created_at: row.created_at,
      updated_at: row.updated_at,
      completed_at: (row.completed_at ?? null) as number | null,
      deleted_at: (row.deleted_at ?? null) as number | null,
    } satisfies TaskPushRow;
  });
}

export function validateRecurringTaskRows(input: unknown): RecurringTaskPushRow[] {
  if (input === undefined) return [];
  if (!Array.isArray(input))
    throw new ApiError(400, "INVALID_REQUEST", "recurring_tasks must be an array");
  assertBatchSize("recurring_tasks", input);

  return input.map((raw, i) => {
    const row = raw as Record<string, unknown>;
    const e = "recurring_tasks";
    if (!isString(row.id)) invalid(e, i, "id");
    if (!isString(row.name)) invalid(e, i, "name");
    if (!isNullableString(row.description)) invalid(e, i, "description");
    if (!isString(row.recurring_type)) invalid(e, i, "recurring_type");
    if (!isNumber(row.recurring_interval)) invalid(e, i, "recurring_interval");
    if (!isNumber(row.base_date_epoch)) invalid(e, i, "base_date_epoch");
    if (!isNullableString(row.at_time)) invalid(e, i, "at_time");
    if (!isNullableNumber(row.lat)) invalid(e, i, "lat");
    if (!isNullableNumber(row.lng)) invalid(e, i, "lng");
    if (!isNullableString(row.timezone)) invalid(e, i, "timezone");
    if (!isNullableNumber(row.hijri_date_offset)) invalid(e, i, "hijri_date_offset");
    if (!isNullableString(row.tags)) invalid(e, i, "tags");
    if (!isNullableString(row.recurring_end)) invalid(e, i, "recurring_end");
    if (!isNullableNumber(row.recurring_end_epoch)) invalid(e, i, "recurring_end_epoch");
    if (!isNullableNumber(row.recurring_end_occurrences))
      invalid(e, i, "recurring_end_occurrences");
    if (!isNumber(row.use_gregorian)) invalid(e, i, "use_gregorian");
    if (!isNullableString(row.occurrence_exceptions)) invalid(e, i, "occurrence_exceptions");
    if (!isNumber(row.created_at)) invalid(e, i, "created_at");
    if (!isNumber(row.updated_at)) invalid(e, i, "updated_at");
    if (!isNullableNumber(row.deleted_at)) invalid(e, i, "deleted_at");

    return {
      id: row.id,
      name: row.name,
      description: (row.description ?? null) as string | null,
      recurring_type: row.recurring_type,
      recurring_interval: row.recurring_interval,
      base_date_epoch: row.base_date_epoch,
      at_time: (row.at_time ?? null) as string | null,
      lat: (row.lat ?? null) as number | null,
      lng: (row.lng ?? null) as number | null,
      timezone: (row.timezone ?? null) as string | null,
      hijri_date_offset: (row.hijri_date_offset ?? null) as number | null,
      tags: (row.tags ?? null) as string | null,
      recurring_end: (row.recurring_end ?? null) as string | null,
      recurring_end_epoch: (row.recurring_end_epoch ?? null) as number | null,
      recurring_end_occurrences: (row.recurring_end_occurrences ?? null) as number | null,
      use_gregorian: row.use_gregorian,
      occurrence_exceptions: (row.occurrence_exceptions ?? null) as string | null,
      created_at: row.created_at,
      updated_at: row.updated_at,
      deleted_at: (row.deleted_at ?? null) as number | null,
    } satisfies RecurringTaskPushRow;
  });
}

export function validateSettingsRows(input: unknown): SettingsPushRow[] {
  if (input === undefined) return [];
  if (!Array.isArray(input))
    throw new ApiError(400, "INVALID_REQUEST", "settings must be an array");
  assertBatchSize("settings", input);

  return input.map((raw, i) => {
    const row = raw as Record<string, unknown>;
    if (!isString(row.id)) invalid("settings", i, "id");
    if (!isString(row.payload)) invalid("settings", i, "payload");
    if (!isNumber(row.updated_at)) invalid("settings", i, "updated_at");

    return {
      id: row.id,
      payload: row.payload,
      updated_at: row.updated_at,
    } satisfies SettingsPushRow;
  });
}
