import { recurringTasks, settings, tags, tasks } from "@/db/schema";

/**
 * Maps each synced table's Drizzle columns onto the snake_case wire keys
 * the client sends/expects (see packages/app/src/infra/sync/types.ts).
 * Shared by /sync/push (to report a rejected row's current server state)
 * and /sync/pull (to page through changed rows) so both return byte-
 * identical shapes for the same table.
 */
export const taskWireColumns = {
  id: tasks.id,
  name: tasks.name,
  description: tasks.description,
  status: tasks.status,
  at_time: tasks.atTime,
  at_epoch_millis: tasks.atEpochMillis,
  lat: tasks.lat,
  lng: tasks.lng,
  timezone: tasks.timezone,
  recurring_type: tasks.recurringType,
  recurring_interval: tasks.recurringInterval,
  recurring_task_id: tasks.recurringTaskId,
  hijri_date_offset: tasks.hijriDateOffset,
  created_at: tasks.createdAt,
  updated_at: tasks.updatedAt,
  completed_at: tasks.completedAt,
  deleted_at: tasks.deletedAt,
  rev: tasks.rev,
} as const;

export const recurringTaskWireColumns = {
  id: recurringTasks.id,
  name: recurringTasks.name,
  description: recurringTasks.description,
  recurring_type: recurringTasks.recurringType,
  recurring_interval: recurringTasks.recurringInterval,
  base_date_epoch: recurringTasks.baseDateEpoch,
  at_time: recurringTasks.atTime,
  lat: recurringTasks.lat,
  lng: recurringTasks.lng,
  timezone: recurringTasks.timezone,
  hijri_date_offset: recurringTasks.hijriDateOffset,
  recurring_end: recurringTasks.recurringEnd,
  recurring_end_epoch: recurringTasks.recurringEndEpoch,
  recurring_end_occurrences: recurringTasks.recurringEndOccurrences,
  use_gregorian: recurringTasks.useGregorian,
  occurrence_exceptions: recurringTasks.occurrenceExceptions,
  created_at: recurringTasks.createdAt,
  updated_at: recurringTasks.updatedAt,
  deleted_at: recurringTasks.deletedAt,
  rev: recurringTasks.rev,
} as const;

export const settingsWireColumns = {
  key: settings.key,
  value: settings.value,
  updated_at: settings.updatedAt,
  rev: settings.rev,
} as const;

export const tagWireColumns = {
  id: tags.id,
  name: tags.name,
  color: tags.color,
  created_at: tags.createdAt,
  updated_at: tags.updatedAt,
  deleted_at: tags.deletedAt,
  rev: tags.rev,
} as const;
