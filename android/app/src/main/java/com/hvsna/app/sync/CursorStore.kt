package com.hvsna.app.sync

import com.hvsna.app.data.SyncStateDao
import com.hvsna.app.data.SyncStateKeys

/** Local-only sync bookkeeping (pull cursors, last-success timestamp) — see SyncState.kt. */
class CursorStore(private val dao: SyncStateDao) {
    suspend fun getCursors(): SyncPullCursors = SyncPullCursors(
        tasks = dao.get(SyncStateKeys.CURSOR_TASKS)?.toLongOrNull() ?: 0,
        recurringTasks = dao.get(SyncStateKeys.CURSOR_RECURRING_TASKS)?.toLongOrNull() ?: 0,
        settings = dao.get(SyncStateKeys.CURSOR_SETTINGS)?.toLongOrNull() ?: 0,
        tags = dao.get(SyncStateKeys.CURSOR_TAGS)?.toLongOrNull() ?: 0,
    )

    suspend fun setTasksCursor(value: Long) = dao.set(SyncStateKeys.CURSOR_TASKS, value.toString())
    suspend fun setRecurringTasksCursor(value: Long) = dao.set(SyncStateKeys.CURSOR_RECURRING_TASKS, value.toString())
    suspend fun setSettingsCursor(value: Long) = dao.set(SyncStateKeys.CURSOR_SETTINGS, value.toString())
    suspend fun setTagsCursor(value: Long) = dao.set(SyncStateKeys.CURSOR_TAGS, value.toString())

    suspend fun getLastSuccessAt(): Long? = dao.get(SyncStateKeys.LAST_SUCCESS_AT)?.toLongOrNull()
    suspend fun setLastSuccessAt(at: Long) = dao.set(SyncStateKeys.LAST_SUCCESS_AT, at.toString())
}
