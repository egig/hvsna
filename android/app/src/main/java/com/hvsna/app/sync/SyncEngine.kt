package com.hvsna.app.sync

import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.decodeFromJsonElement

private const val BATCH_SIZE = 500

/**
 * push()/pull()/fullSync() — mirrors packages/app/src/modules/sync/
 * sync-engine.ts: batched loops, FK-safe apply order (tags -> recurring_tasks
 * -> tasks -> settings on both directions), push-before-pull ("this device's
 * edits win the round trip before it reconciles with changes made elsewhere").
 */
class SyncEngine(
    private val repository: SyncRepository,
    private val api: SyncApi,
    private val cursorStore: CursorStore,
) {
    private val json = Json { ignoreUnknownKeys = true }

    /** Returns whether anything was actually pushed. */
    suspend fun push(): Boolean {
        var pushedAnything = false
        var more = true
        while (more) {
            val dirtyTags = repository.findDirtyTags(BATCH_SIZE)
            val dirtyRecurringTasks = repository.findDirtyRecurrenceRules(BATCH_SIZE)
            val dirtyTasks = repository.findDirtyTasks(BATCH_SIZE)
            val dirtySettings = repository.findDirtySettings(BATCH_SIZE)

            if (dirtyTags.isEmpty() && dirtyRecurringTasks.isEmpty() && dirtyTasks.isEmpty() && dirtySettings.isEmpty()) break
            pushedAnything = true

            val request = SyncPushRequest(
                tasks = dirtyTasks.map { it.toWireRow(repository.tagIdsForTask(it.id)) },
                recurring_tasks = dirtyRecurringTasks.map { it.toWireRow() },
                settings = dirtySettings.map { it.toWireRow() },
                tags = dirtyTags.map { it.toWireRow() },
            )
            val response = api.push(request)

            clearAndAdoptRejected(response.tags, repository::clearDirtyTags) { row: TagWireRow -> repository.applyIncomingTag(row) }
            clearAndAdoptRejected(response.recurring_tasks, repository::clearDirtyRecurrenceRules) { row: RecurringTaskWireRow -> repository.applyIncomingRecurrenceRule(row) }
            clearAndAdoptRejected(response.tasks, repository::clearDirtyTasks) { row: TaskWireRow -> repository.applyIncomingTask(row) }
            clearAndAdoptRejected(response.settings, repository::clearDirtySettings) { row: SettingsWireRow -> repository.applyIncomingSetting(row) }

            more = dirtyTags.size == BATCH_SIZE || dirtyRecurringTasks.size == BATCH_SIZE ||
                dirtyTasks.size == BATCH_SIZE || dirtySettings.size == BATCH_SIZE
        }
        return pushedAnything
    }

    /** Returns whether anything was actually applied locally. */
    suspend fun pull(): Boolean {
        var appliedAnything = false
        var cursors = cursorStore.getCursors()
        var more = true
        while (more) {
            val response = api.pull(cursors, BATCH_SIZE)

            response.tags.rows.forEach { if (repository.applyIncomingTag(it)) appliedAnything = true }
            response.recurring_tasks.rows.forEach { if (repository.applyIncomingRecurrenceRule(it)) appliedAnything = true }
            response.tasks.rows.forEach { if (repository.applyIncomingTask(it)) appliedAnything = true }
            response.settings.rows.forEach { if (repository.applyIncomingSetting(it)) appliedAnything = true }

            cursorStore.setTagsCursor(response.tags.next_cursor)
            cursorStore.setRecurringTasksCursor(response.recurring_tasks.next_cursor)
            cursorStore.setTasksCursor(response.tasks.next_cursor)
            cursorStore.setSettingsCursor(response.settings.next_cursor)

            cursors = SyncPullCursors(
                tasks = response.tasks.next_cursor,
                recurringTasks = response.recurring_tasks.next_cursor,
                settings = response.settings.next_cursor,
                tags = response.tags.next_cursor,
            )
            more = response.tasks.has_more || response.recurring_tasks.has_more ||
                response.settings.has_more || response.tags.has_more
        }
        return appliedAnything
    }

    /** Push first "so this device's own edits win the round trip before it reconciles with changes made elsewhere." */
    suspend fun fullSync(): Boolean {
        val pushed = push()
        val pulled = pull()
        cursorStore.setLastSuccessAt(System.currentTimeMillis())
        return pushed || pulled
    }

    /**
     * Clears `_dirty` on every applied id, and for rejected rows whose
     * `server_row` is a full row (an LWW loss, distinguished from a
     * lightweight `{id, reason}` marker by the presence of `updated_at` —
     * mirrors the web client's `isFullServerRow`) adopts the winning server
     * copy locally so this device stops re-pushing stale data every cycle.
     */
    private suspend inline fun <reified T> clearAndAdoptRejected(
        result: SyncPushTableResult,
        clearDirty: suspend (List<String>) -> Unit,
        applyIncoming: suspend (T) -> Boolean,
    ) {
        if (result.applied.isNotEmpty()) clearDirty(result.applied)
        for (entry in result.rejected) {
            val obj = entry.server_row as? JsonObject ?: continue
            if (!obj.containsKey("updated_at")) continue // {id, reason} marker — no row data to apply
            applyIncoming(json.decodeFromJsonElement<T>(entry.server_row))
        }
    }
}
