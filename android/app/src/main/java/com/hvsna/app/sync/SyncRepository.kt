package com.hvsna.app.sync

import com.hvsna.app.data.RecurrenceRule
import com.hvsna.app.data.SettingsDao
import com.hvsna.app.data.SettingsEntry
import com.hvsna.app.data.Tag
import com.hvsna.app.data.Task
import com.hvsna.app.data.TaskDao

/**
 * Sync-specific data access, separate from TaskRepository/SettingsRepository
 * (which are shaped for UI needs) — mirrors packages/app/src/modules/sync/
 * dirty-rows.ts operating directly against the sqlite client rather than
 * through a domain repository.
 */
class SyncRepository(private val taskDao: TaskDao, private val settingsDao: SettingsDao) {
    /** Settings keys with no web counterpart — never pushed (see SettingsKeys' doc comment). */
    private val settingsPushExclusions = setOf(
        com.hvsna.app.data.SettingsKeys.CALCULATION_METHOD,
        com.hvsna.app.data.SettingsKeys.MADHAB,
        com.hvsna.app.data.SettingsKeys.HIJRI_ADJUSTMENT,
    )

    suspend fun findDirtyTasks(limit: Int): List<Task> = taskDao.findDirtyTasks(limit)
    suspend fun clearDirtyTasks(ids: List<String>) = taskDao.clearDirtyTasks(ids)
    suspend fun findDirtyRecurrenceRules(limit: Int): List<RecurrenceRule> = taskDao.findDirtyRecurrenceRules(limit)
    suspend fun clearDirtyRecurrenceRules(ids: List<String>) = taskDao.clearDirtyRecurrenceRules(ids)
    suspend fun findDirtyTags(limit: Int): List<Tag> = taskDao.findDirtyTags(limit)
    suspend fun clearDirtyTags(ids: List<String>) = taskDao.clearDirtyTags(ids)

    suspend fun findDirtySettings(limit: Int): List<SettingsEntry> =
        settingsDao.findDirty(limit).filter { it.key !in settingsPushExclusions }

    suspend fun clearDirtySettings(keys: List<String>) = settingsDao.clearDirty(keys)

    suspend fun tagIdsForTask(taskId: String): List<String> = taskDao.getTagIdsForTask(taskId)

    suspend fun applyIncomingTask(row: TaskWireRow): Boolean = taskDao.applyIncomingTask(row.toTask(), row.tag_ids)
    suspend fun applyIncomingRecurrenceRule(row: RecurringTaskWireRow): Boolean = taskDao.applyIncomingRecurrenceRule(row.toRecurrenceRule())
    suspend fun applyIncomingTag(row: TagWireRow): Boolean = taskDao.applyIncomingTag(row.toTag())
    suspend fun applyIncomingSetting(row: SettingsWireRow): Boolean = settingsDao.applyIncoming(row.toSettingsEntry())
}
