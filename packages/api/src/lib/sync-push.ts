import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { recurringTasks, settings, tags, tasks } from "@/db/schema";
import {
  recurringTaskWireColumns,
  settingsWireColumns,
  tagWireColumns,
  taskWireColumns,
} from "./sync-columns";
import {
  fetchRecurringTaskTagIds,
  fetchTaskTagIds,
  replaceRecurringTaskTagLinks,
  replaceTaskTagLinks,
} from "./sync-tag-links";
import type {
  RecurringTaskPushRow,
  SettingsPushRow,
  SyncPushTableResult,
  TagPushRow,
  TaskPushRow,
} from "./sync-types";

const FOREIGN_KEY_VIOLATION = "23503";

function isForeignKeyViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === FOREIGN_KEY_VIOLATION
  );
}

function diffIds(inputIds: string[], returnedIds: string[]): string[] {
  const returned = new Set(returnedIds);
  return inputIds.filter((id) => !returned.has(id));
}

export async function pushTags(userId: string, rows: TagPushRow[]): Promise<SyncPushTableResult> {
  if (rows.length === 0) return { applied: [], rejected: [] };

  const values = rows.map((r) => ({
    userId,
    id: r.id,
    name: r.name,
    color: r.color,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    deletedAt: r.deleted_at,
  }));

  const returned = await db
    .insert(tags)
    .values(values)
    .onConflictDoUpdate({
      target: [tags.userId, tags.id],
      set: {
        name: sql`excluded.name`,
        color: sql`excluded.color`,
        updatedAt: sql`excluded.updated_at`,
        deletedAt: sql`excluded.deleted_at`,
        rev: sql`nextval('tags_rev_seq')`,
      },
      where: sql`excluded.updated_at >= ${tags.updatedAt}`,
    })
    .returning({ id: tags.id });

  const applied = returned.map((r) => r.id);
  const rejectedIds = diffIds(
    rows.map((r) => r.id),
    applied
  );
  if (rejectedIds.length === 0) return { applied, rejected: [] };

  const serverRows = await db
    .select(tagWireColumns)
    .from(tags)
    .where(and(eq(tags.userId, userId), inArray(tags.id, rejectedIds)));

  return {
    applied,
    rejected: serverRows.map((row) => ({ id: row.id, server_row: row })),
  };
}

export async function pushRecurringTasks(
  userId: string,
  rows: RecurringTaskPushRow[]
): Promise<SyncPushTableResult> {
  if (rows.length === 0) return { applied: [], rejected: [] };

  const values = rows.map((r) => ({
    userId,
    id: r.id,
    name: r.name,
    description: r.description,
    recurringType: r.recurring_type,
    recurringInterval: r.recurring_interval,
    baseDateEpoch: r.base_date_epoch,
    atTime: r.at_time,
    lat: r.lat,
    lng: r.lng,
    timezone: r.timezone,
    hijriDateOffset: r.hijri_date_offset,
    durationMinutes: r.duration_minutes,
    recurringEnd: r.recurring_end,
    recurringEndEpoch: r.recurring_end_epoch,
    recurringEndOccurrences: r.recurring_end_occurrences,
    useGregorian: r.use_gregorian,
    occurrenceExceptions: r.occurrence_exceptions,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    deletedAt: r.deleted_at,
  }));

  const returned = await db
    .insert(recurringTasks)
    .values(values)
    .onConflictDoUpdate({
      target: [recurringTasks.userId, recurringTasks.id],
      set: {
        name: sql`excluded.name`,
        description: sql`excluded.description`,
        recurringType: sql`excluded.recurring_type`,
        recurringInterval: sql`excluded.recurring_interval`,
        baseDateEpoch: sql`excluded.base_date_epoch`,
        atTime: sql`excluded.at_time`,
        lat: sql`excluded.lat`,
        lng: sql`excluded.lng`,
        timezone: sql`excluded.timezone`,
        hijriDateOffset: sql`excluded.hijri_date_offset`,
        durationMinutes: sql`excluded.duration_minutes`,
        recurringEnd: sql`excluded.recurring_end`,
        recurringEndEpoch: sql`excluded.recurring_end_epoch`,
        recurringEndOccurrences: sql`excluded.recurring_end_occurrences`,
        useGregorian: sql`excluded.use_gregorian`,
        occurrenceExceptions: sql`excluded.occurrence_exceptions`,
        updatedAt: sql`excluded.updated_at`,
        deletedAt: sql`excluded.deleted_at`,
        rev: sql`nextval('recurring_tasks_rev_seq')`,
      },
      where: sql`excluded.updated_at >= ${recurringTasks.updatedAt}`,
    })
    .returning({ id: recurringTasks.id });

  const applied = returned.map((r) => r.id);
  await replaceRecurringTaskTagLinks(
    userId,
    rows.filter((r) => applied.includes(r.id)).map((r) => ({ id: r.id, tag_ids: r.tag_ids }))
  );

  const rejectedIds = diffIds(
    rows.map((r) => r.id),
    applied
  );
  if (rejectedIds.length === 0) return { applied, rejected: [] };

  const serverRows = await db
    .select(recurringTaskWireColumns)
    .from(recurringTasks)
    .where(and(eq(recurringTasks.userId, userId), inArray(recurringTasks.id, rejectedIds)));
  const tagMap = await fetchRecurringTaskTagIds(userId, rejectedIds);

  return {
    applied,
    rejected: serverRows.map((row) => ({
      id: row.id,
      server_row: { ...row, tag_ids: tagMap.get(row.id) ?? [] },
    })),
  };
}

async function upsertTaskRow(userId: string, r: TaskPushRow): Promise<string | null> {
  const returned = await db
    .insert(tasks)
    .values({
      userId,
      id: r.id,
      name: r.name,
      description: r.description,
      status: r.status,
      atTime: r.at_time,
      atEpochMillis: r.at_epoch_millis,
      lat: r.lat,
      lng: r.lng,
      timezone: r.timezone,
      recurringType: r.recurring_type,
      recurringInterval: r.recurring_interval,
      recurringTaskId: r.recurring_task_id,
      hijriDateOffset: r.hijri_date_offset,
      durationMinutes: r.duration_minutes,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      completedAt: r.completed_at,
      deletedAt: r.deleted_at,
    })
    .onConflictDoUpdate({
      target: [tasks.userId, tasks.id],
      set: {
        name: sql`excluded.name`,
        description: sql`excluded.description`,
        status: sql`excluded.status`,
        atTime: sql`excluded.at_time`,
        atEpochMillis: sql`excluded.at_epoch_millis`,
        lat: sql`excluded.lat`,
        lng: sql`excluded.lng`,
        timezone: sql`excluded.timezone`,
        recurringType: sql`excluded.recurring_type`,
        recurringInterval: sql`excluded.recurring_interval`,
        recurringTaskId: sql`excluded.recurring_task_id`,
        hijriDateOffset: sql`excluded.hijri_date_offset`,
        durationMinutes: sql`excluded.duration_minutes`,
        updatedAt: sql`excluded.updated_at`,
        completedAt: sql`excluded.completed_at`,
        deletedAt: sql`excluded.deleted_at`,
        rev: sql`nextval('tasks_rev_seq')`,
      },
      where: sql`excluded.updated_at >= ${tasks.updatedAt}`,
    })
    .returning({ id: tasks.id });

  return returned[0]?.id ?? null;
}

export async function pushTasks(
  userId: string,
  rows: TaskPushRow[]
): Promise<SyncPushTableResult> {
  if (rows.length === 0) return { applied: [], rejected: [] };

  const applied: string[] = [];
  const invalidReferenceIds: string[] = [];

  try {
    const values = rows.map((r) => ({
      userId,
      id: r.id,
      name: r.name,
      description: r.description,
      status: r.status,
      atTime: r.at_time,
      atEpochMillis: r.at_epoch_millis,
      lat: r.lat,
      lng: r.lng,
      timezone: r.timezone,
      recurringType: r.recurring_type,
      recurringInterval: r.recurring_interval,
      recurringTaskId: r.recurring_task_id,
      hijriDateOffset: r.hijri_date_offset,
      durationMinutes: r.duration_minutes,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      completedAt: r.completed_at,
      deletedAt: r.deleted_at,
    }));

    const returned = await db
      .insert(tasks)
      .values(values)
      .onConflictDoUpdate({
        target: [tasks.userId, tasks.id],
        set: {
          name: sql`excluded.name`,
          description: sql`excluded.description`,
          status: sql`excluded.status`,
          atTime: sql`excluded.at_time`,
          atEpochMillis: sql`excluded.at_epoch_millis`,
          lat: sql`excluded.lat`,
          lng: sql`excluded.lng`,
          timezone: sql`excluded.timezone`,
          recurringType: sql`excluded.recurring_type`,
          recurringInterval: sql`excluded.recurring_interval`,
          recurringTaskId: sql`excluded.recurring_task_id`,
          hijriDateOffset: sql`excluded.hijri_date_offset`,
          durationMinutes: sql`excluded.duration_minutes`,
          updatedAt: sql`excluded.updated_at`,
          completedAt: sql`excluded.completed_at`,
          deletedAt: sql`excluded.deleted_at`,
          rev: sql`nextval('tasks_rev_seq')`,
        },
        where: sql`excluded.updated_at >= ${tasks.updatedAt}`,
      })
      .returning({ id: tasks.id });

    applied.push(...returned.map((r) => r.id));
  } catch (error) {
    if (!isForeignKeyViolation(error)) throw error;

    // One or more rows reference a recurring_task_id that doesn't exist
    // server-side yet (e.g. offline-created recurring task + instances in
    // the same push, arriving out of order). Fall back to per-row upserts
    // so only the offending rows are rejected instead of the whole batch.
    for (const row of rows) {
      try {
        const id = await upsertTaskRow(userId, row);
        if (id) applied.push(id);
      } catch (rowError) {
        if (!isForeignKeyViolation(rowError)) throw rowError;
        invalidReferenceIds.push(row.id);
      }
    }
  }

  await replaceTaskTagLinks(
    userId,
    rows.filter((r) => applied.includes(r.id)).map((r) => ({ id: r.id, tag_ids: r.tag_ids }))
  );

  const rejectedIds = diffIds(
    rows.map((r) => r.id),
    applied
  ).filter((id) => !invalidReferenceIds.includes(id));

  const serverRows = rejectedIds.length
    ? await db
        .select(taskWireColumns)
        .from(tasks)
        .where(and(eq(tasks.userId, userId), inArray(tasks.id, rejectedIds)))
    : [];
  const tagMap = await fetchTaskTagIds(userId, rejectedIds);

  return {
    applied,
    rejected: [
      ...serverRows.map((row) => ({
        id: row.id,
        server_row: { ...row, tag_ids: tagMap.get(row.id) ?? [] },
      })),
      ...invalidReferenceIds.map((id) => ({
        id,
        server_row: { id, reason: "INVALID_REFERENCE" },
      })),
    ],
  };
}

export async function pushSettings(
  userId: string,
  rows: SettingsPushRow[]
): Promise<SyncPushTableResult> {
  if (rows.length === 0) return { applied: [], rejected: [] };

  const values = rows.map((r) => ({
    userId,
    key: r.key,
    value: r.value,
    updatedAt: r.updated_at,
  }));

  const returned = await db
    .insert(settings)
    .values(values)
    .onConflictDoUpdate({
      target: [settings.userId, settings.key],
      set: {
        value: sql`excluded.value`,
        updatedAt: sql`excluded.updated_at`,
        rev: sql`nextval('settings_rev_seq')`,
      },
      where: sql`excluded.updated_at >= ${settings.updatedAt}`,
    })
    .returning({ id: settings.key });

  const applied = returned.map((r) => r.id);
  const rejectedIds = diffIds(
    rows.map((r) => r.key),
    applied
  );
  if (rejectedIds.length === 0) return { applied, rejected: [] };

  const serverRows = await db
    .select(settingsWireColumns)
    .from(settings)
    .where(and(eq(settings.userId, userId), inArray(settings.key, rejectedIds)));

  return {
    applied,
    rejected: serverRows.map((row) => ({ id: row.key, server_row: row })),
  };
}
