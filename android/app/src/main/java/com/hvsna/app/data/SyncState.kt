package com.hvsna.app.data

import io.objectbox.annotation.Entity
import io.objectbox.annotation.Id
import io.objectbox.annotation.Index
import io.objectbox.annotation.Unique

/**
 * Local-only sync bookkeeping — per-table pull cursors and last-success
 * timestamp. Never itself synced, matching packages/app's `_sync_state`
 * table (modules/sqlite/schema.ts).
 */
@Entity
data class SyncStateEntry(
    @Unique @Index val key: String,
    val value: String,
    @Id var boxId: Long = 0,
)

object SyncStateKeys {
    const val CURSOR_TASKS = "sync_cursor_tasks"
    const val CURSOR_RECURRING_TASKS = "sync_cursor_recurring_tasks"
    const val CURSOR_SETTINGS = "sync_cursor_settings"
    const val CURSOR_TAGS = "sync_cursor_tags"
    const val LAST_SUCCESS_AT = "sync_last_success_at"
}
