package com.hvsna.app.sync

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonElement

/**
 * Wire shapes for /sync/push and /sync/pull — snake_case, 1:1 with
 * packages/api/src/lib/sync-types.ts / packages/app/src/infra/sync/types.ts.
 * Deliberately raw wire types rather than the app's Task/RecurrenceRule/Tag
 * Room entities — local column names diverge from these (title vs. name,
 * isDone vs. status, etc.), so DirtyRows.kt owns the explicit mapping in
 * both directions.
 */
@Serializable
data class TaskWireRow(
    val id: String,
    val name: String,
    val description: String?,
    val status: Int,
    val at_time: String?,
    val at_epoch_millis: Long?,
    val lat: Double?,
    val lng: Double?,
    val timezone: String?,
    val recurring_type: String?,
    val recurring_interval: Int?,
    val recurring_task_id: String?,
    val hijri_date_offset: Int?,
    val tag_ids: List<String>,
    val created_at: Long,
    val updated_at: Long,
    val completed_at: Long?,
    val deleted_at: Long?,
)

@Serializable
data class RecurringTaskWireRow(
    val id: String,
    val name: String,
    val description: String?,
    val recurring_type: String,
    val recurring_interval: Int,
    val base_date_epoch: Long,
    val at_time: String?,
    val lat: Double?,
    val lng: Double?,
    val timezone: String?,
    val hijri_date_offset: Int?,
    val tag_ids: List<String>,
    val recurring_end: String?,
    val recurring_end_epoch: Long?,
    val recurring_end_occurrences: Int?,
    val use_gregorian: Int,
    val occurrence_exceptions: String?,
    val created_at: Long,
    val updated_at: Long,
    val deleted_at: Long?,
)

@Serializable
data class SettingsWireRow(
    val key: String,
    val value: String,
    val updated_at: Long,
)

@Serializable
data class TagWireRow(
    val id: String,
    val name: String,
    val color: String,
    val created_at: Long,
    val updated_at: Long,
    val deleted_at: Long?,
)

@Serializable
data class SyncPushRequest(
    val tasks: List<TaskWireRow>,
    val recurring_tasks: List<RecurringTaskWireRow>,
    val settings: List<SettingsWireRow>,
    val tags: List<TagWireRow>,
)

/**
 * A rejected push row's `server_row` is either the full winning server row
 * (a last-write-wins loss, safe to apply locally) or a lightweight
 * `{id, reason}` marker (e.g. INVALID_REFERENCE) with no row data — same
 * shape ambiguity as packages/app's RejectedServerRow union. Deserialized as
 * raw JSON and disambiguated by the presence of `updated_at`, mirroring the
 * web client's `isFullServerRow` check.
 */
@Serializable
data class RejectedEntry(val id: String, val server_row: JsonElement)

@Serializable
data class SyncPushTableResult(val applied: List<String>, val rejected: List<RejectedEntry>)

@Serializable
data class SyncPushResponse(
    val tasks: SyncPushTableResult,
    val recurring_tasks: SyncPushTableResult,
    val settings: SyncPushTableResult,
    val tags: SyncPushTableResult,
)

@Serializable
data class SyncPullTableResult<T>(val rows: List<T>, val next_cursor: Long, val has_more: Boolean)

@Serializable
data class SyncPullResponse(
    val tasks: SyncPullTableResult<TaskWireRow>,
    val recurring_tasks: SyncPullTableResult<RecurringTaskWireRow>,
    val settings: SyncPullTableResult<SettingsWireRow>,
    val tags: SyncPullTableResult<TagWireRow>,
)

data class SyncPullCursors(
    val tasks: Long = 0,
    val recurringTasks: Long = 0,
    val settings: Long = 0,
    val tags: Long = 0,
)
