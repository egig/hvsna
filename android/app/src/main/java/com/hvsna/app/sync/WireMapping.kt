package com.hvsna.app.sync

import com.hvsna.app.data.RecurrenceRule
import com.hvsna.app.data.SettingsEntry
import com.hvsna.app.data.Tag
import com.hvsna.app.data.Task

/**
 * Local Room entities use different column names/types than the wire format
 * (title vs. name, isDone vs. status, Long ARGB color vs. hex string, ...) —
 * these are the explicit translations in both directions. Local-only fields
 * with no wire counterpart (reminderEnabled/reminderOffsetMinutes) are
 * simply dropped when going to the wire and left for the caller (see
 * TaskDao.applyIncomingTask) to preserve from the existing row when coming
 * back from it.
 */

fun Task.toWireRow(tagIds: List<String>): TaskWireRow = TaskWireRow(
    id = id,
    name = title,
    description = description,
    status = isDone,
    at_time = atTime,
    at_epoch_millis = scheduledTime,
    lat = lat,
    lng = lng,
    timezone = timezone,
    recurring_type = recurringType,
    recurring_interval = recurringInterval,
    recurring_task_id = recurringTaskId,
    hijri_date_offset = hijriDateOffset,
    tag_ids = tagIds,
    created_at = createdAt,
    updated_at = updatedAt,
    completed_at = completedTime,
    deleted_at = deletedAt,
)

fun TaskWireRow.toTask(): Task = Task(
    id = id,
    title = name,
    description = description ?: "",
    scheduledTime = at_epoch_millis,
    isDone = status,
    atTime = at_time,
    completedTime = completed_at,
    recurringTaskId = recurring_task_id,
    recurringType = recurring_type,
    recurringInterval = recurring_interval,
    lat = lat,
    lng = lng,
    timezone = timezone,
    hijriDateOffset = hijri_date_offset,
    createdAt = created_at,
    updatedAt = updated_at,
    deletedAt = deleted_at,
)

/** tag_ids is always empty going out — Android has no recurring-template tag association (see RecurrenceManager's tag-model note). */
fun RecurrenceRule.toWireRow(): RecurringTaskWireRow = RecurringTaskWireRow(
    id = id,
    name = title,
    description = description,
    recurring_type = recurringType,
    recurring_interval = recurringInterval,
    base_date_epoch = baseDateEpoch,
    at_time = atTime,
    lat = lat,
    lng = lng,
    timezone = timezone,
    hijri_date_offset = hijriDateOffset,
    tag_ids = emptyList(),
    recurring_end = recurringEnd,
    recurring_end_epoch = recurringEndEpoch,
    recurring_end_occurrences = recurringEndOccurrences,
    use_gregorian = if (useGregorian) 1 else 0,
    occurrence_exceptions = occurrenceExceptions,
    created_at = createdAt,
    updated_at = updatedAt,
    deleted_at = deletedAt,
)

fun RecurringTaskWireRow.toRecurrenceRule(): RecurrenceRule = RecurrenceRule(
    id = id,
    title = name,
    description = description ?: "",
    recurringType = recurring_type,
    recurringInterval = recurring_interval,
    baseDateEpoch = base_date_epoch,
    atTime = at_time,
    lat = lat,
    lng = lng,
    timezone = timezone,
    hijriDateOffset = hijri_date_offset,
    recurringEnd = recurring_end,
    recurringEndEpoch = recurring_end_epoch,
    recurringEndOccurrences = recurring_end_occurrences,
    useGregorian = use_gregorian != 0,
    occurrenceExceptions = occurrence_exceptions,
    createdAt = created_at,
    updatedAt = updated_at,
    deletedAt = deleted_at,
)

private const val DEFAULT_TAG_COLOR = 0xFF90A4AEL

/** Android stores an ARGB Long; web/server store a "#RRGGBB" hex string — alpha never round-trips (always opaque). */
fun Tag.toWireRow(): TagWireRow = TagWireRow(
    id = id,
    name = name,
    color = "#%06X".format(color and 0xFFFFFFL),
    created_at = createdAt,
    updated_at = updatedAt,
    deleted_at = deletedAt,
)

fun TagWireRow.toTag(): Tag = Tag(
    id = id,
    name = name,
    color = 0xFF000000L or (color.removePrefix("#").toLongOrNull(16) ?: DEFAULT_TAG_COLOR),
    createdAt = created_at,
    updatedAt = updated_at,
    deletedAt = deleted_at,
)

fun SettingsEntry.toWireRow(): SettingsWireRow = SettingsWireRow(key = key, value = value, updated_at = updatedAt)

fun SettingsWireRow.toSettingsEntry(): SettingsEntry = SettingsEntry(key = key, value = value, updatedAt = updated_at)
