package com.hvsna.app.data

import android.app.backup.BackupManager
import android.content.Context
import kotlinx.coroutines.flow.Flow

class TaskRepository(private val dao: TaskDao, context: Context) {
    private val appContext = context.applicationContext
    private val backupManager by lazy { BackupManager(appContext) }

    private fun notifyBackupDataChanged() {
        backupManager.dataChanged()
    }

    fun getOverdue(todayStart: Long): Flow<List<TaskWithTags>> = dao.getOverdue(todayStart)
    fun getToday(todayStart: Long, tomorrowStart: Long): Flow<List<TaskWithTags>> = dao.getToday(todayStart, tomorrowStart)
    fun getCompleted(todayStart: Long, tomorrowStart: Long): Flow<List<TaskWithTags>> = dao.getCompleted(todayStart, tomorrowStart)
    fun getUpcoming(tomorrowStart: Long): Flow<List<TaskWithTags>> = dao.getUpcoming(tomorrowStart)
    fun getUnscheduled(): Flow<List<TaskWithTags>> = dao.getUnscheduled()
    fun getBrowse(): Flow<List<TaskWithTags>> = dao.getBrowse()
    fun getAllCompleted(): Flow<List<TaskWithTags>> = dao.getAllCompleted()
    fun search(query: String): Flow<List<TaskWithTags>> = dao.search(query)
    fun getTasksForTag(tagId: Int): Flow<List<TaskWithTags>> = dao.getTasksForTag(tagId)

    suspend fun insert(task: Task): Long = dao.insert(task).also { notifyBackupDataChanged() }
    suspend fun update(task: Task) { dao.update(task); notifyBackupDataChanged() }
    suspend fun delete(task: Task) { dao.delete(task); notifyBackupDataChanged() }

    fun getAllTags(): Flow<List<Tag>> = dao.getAllTags()
    suspend fun insertTag(tag: Tag): Long = dao.insertTag(tag).also { notifyBackupDataChanged() }
    suspend fun updateTag(tag: Tag) { dao.updateTag(tag); notifyBackupDataChanged() }
    suspend fun deleteTag(tag: Tag) { dao.deleteTag(tag); notifyBackupDataChanged() }
    suspend fun getTagCount(): Int = dao.getTagCount()
    suspend fun setTagsForTask(taskId: Int, tagIds: List<Int>) { dao.setTagsForTask(taskId, tagIds); notifyBackupDataChanged() }

    suspend fun insertRecurrenceRule(rule: RecurrenceRule): Long = dao.insertRecurrenceRule(rule).also { notifyBackupDataChanged() }
    suspend fun updateRecurrenceRule(rule: RecurrenceRule) { dao.updateRecurrenceRule(rule); notifyBackupDataChanged() }
    suspend fun deleteRecurrenceRule(rule: RecurrenceRule) { dao.deleteRecurrenceRule(rule); notifyBackupDataChanged() }
    suspend fun getRecurrenceRule(id: Int): RecurrenceRule? = dao.getRecurrenceRule(id)
    fun getAllRecurrenceRules(): Flow<List<RecurrenceRule>> = dao.getAllRecurrenceRules()
    fun getNextOccurrencePerSeries(): Flow<List<TaskWithTags>> = dao.getNextOccurrencePerSeries()
    suspend fun countUndoneForRecurrence(recurrenceId: Int): Int = dao.countUndoneForRecurrence(recurrenceId)
    suspend fun countAllForRecurrence(recurrenceId: Int): Int = dao.countAllForRecurrence(recurrenceId)
    suspend fun getTagIdsForTask(taskId: Int): List<Int> = dao.getTagIdsForTask(taskId)
    suspend fun getLatestTaskForRecurrence(recurrenceId: Int): Task? = dao.getLatestTaskForRecurrence(recurrenceId)
    suspend fun getUndoneTasksForRecurrence(recurrenceId: Int): List<Task> = dao.getUndoneTasksForRecurrence(recurrenceId)
    suspend fun deleteUndoneForRecurrenceExcept(recurrenceId: Int, exceptTaskId: Int) { dao.deleteUndoneForRecurrenceExcept(recurrenceId, exceptTaskId); notifyBackupDataChanged() }
    suspend fun getAllUndonePrayerPinnedTasks(): List<Task> = dao.getAllUndonePrayerPinnedTasks()
    suspend fun getAllUndoneReminderEnabledTasks(): List<Task> = dao.getAllUndoneReminderEnabledTasks()
    suspend fun getTaskById(taskId: Int): Task? = dao.getTaskById(taskId)

    suspend fun getAllTasksSnapshot(): List<Task> = dao.getAllTasksSnapshot()
    suspend fun getAllTaskTagCrossRefsSnapshot(): List<TaskTagCrossRef> = dao.getAllTaskTagCrossRefsSnapshot()

    suspend fun replaceAll(
        tasks: List<Task>,
        tags: List<Tag>,
        taskTagCrossRefs: List<TaskTagCrossRef>,
        recurrenceRules: List<RecurrenceRule>,
    ) {
        dao.replaceAll(tasks, tags, taskTagCrossRefs, recurrenceRules)
        notifyBackupDataChanged()
    }

    suspend fun mergeAll(
        tasks: List<Task>,
        tags: List<Tag>,
        taskTagCrossRefs: List<TaskTagCrossRef>,
        recurrenceRules: List<RecurrenceRule>,
    ) {
        dao.mergeAll(tasks, tags, taskTagCrossRefs, recurrenceRules)
        notifyBackupDataChanged()
    }
}
