package com.hvsna.app.data

import android.app.backup.BackupManager
import android.content.Context
import kotlinx.coroutines.flow.Flow

class TaskRepository(
    private val dao: TaskStore,
    context: Context,
) {
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
    fun getTasksForTag(tagId: String): Flow<List<TaskWithTags>> = dao.getTasksForTag(tagId)

    suspend fun insert(task: Task) { dao.insert(task); notifyBackupDataChanged() }
    suspend fun update(task: Task) { dao.update(task); notifyBackupDataChanged() }
    suspend fun delete(id: String) { dao.delete(id); notifyBackupDataChanged() }

    fun getAllTags(): Flow<List<Tag>> = dao.getAllTags()
    suspend fun insertTag(tag: Tag) { dao.insertTag(tag); notifyBackupDataChanged() }
    suspend fun updateTag(tag: Tag) { dao.updateTag(tag); notifyBackupDataChanged() }
    suspend fun deleteTag(tag: Tag) { dao.deleteTag(tag); notifyBackupDataChanged() }
    suspend fun getTagCount(): Int = dao.getTagCount()
    suspend fun setTagsForTask(taskId: String, tagIds: List<String>) { dao.setTagsForTask(taskId, tagIds); notifyBackupDataChanged() }

    suspend fun insertRecurrenceRule(rule: RecurrenceRule) { dao.insertRecurrenceRule(rule); notifyBackupDataChanged() }
    suspend fun updateRecurrenceRule(rule: RecurrenceRule) { dao.updateRecurrenceRule(rule); notifyBackupDataChanged() }
    suspend fun deleteRecurrenceRule(rule: RecurrenceRule) { dao.deleteRecurrenceRule(rule); notifyBackupDataChanged() }
    suspend fun getRecurrenceRule(id: String): RecurrenceRule? = dao.getRecurrenceRule(id)
    fun getAllRecurrenceRules(): Flow<List<RecurrenceRule>> = dao.getAllRecurrenceRules()
    fun getAllRecurrenceRulesWithTags(): Flow<List<RecurrenceRuleWithTags>> = dao.getAllRecurrenceRulesWithTags()
    suspend fun countUndoneForRecurrence(recurringTaskId: String): Int = dao.countUndoneForRecurrence(recurringTaskId)
    suspend fun getTagIdsForTask(taskId: String): List<String> = dao.getTagIdsForTask(taskId)
    suspend fun getTagIdsForRule(ruleId: String): List<String> = dao.getTagIdsForRule(ruleId)
    suspend fun setTagsForRule(ruleId: String, tagIds: List<String>) { dao.setTagsForRule(ruleId, tagIds); notifyBackupDataChanged() }
    suspend fun getLatestTaskForRecurrence(recurringTaskId: String): Task? = dao.getLatestTaskForRecurrence(recurringTaskId)
    suspend fun getUndoneTasksForRecurrence(recurringTaskId: String): List<Task> = dao.getUndoneTasksForRecurrence(recurringTaskId)
    suspend fun deleteUndoneForRecurrenceExcept(recurringTaskId: String, exceptTaskId: String) {
        dao.deleteUndoneForRecurrenceExcept(recurringTaskId, exceptTaskId)
        notifyBackupDataChanged()
    }
    suspend fun deleteFuturePendingForRecurrenceExcept(recurringTaskId: String, exceptTaskId: String, fromEpoch: Long) {
        dao.deleteFuturePendingForRecurrenceExcept(recurringTaskId, exceptTaskId, fromEpoch)
        notifyBackupDataChanged()
    }
    suspend fun getAllUndonePrayerAnchoredTasks(): List<Task> = dao.getAllUndonePrayerAnchoredTasks()
    suspend fun getAllUndoneReminderEnabledTasks(): List<Task> = dao.getAllUndoneReminderEnabledTasks()
    suspend fun getTaskById(taskId: String): Task? = dao.getTaskById(taskId)

    suspend fun getAllTasksSnapshot(): List<Task> = dao.getAllTasksSnapshot()
    suspend fun getAllTaskTagCrossRefsSnapshot(): List<TaskTagCrossRef> = dao.getAllTaskTagCrossRefsSnapshot()
    suspend fun getAllRecurrenceRuleTagCrossRefsSnapshot(): List<RecurrenceRuleTagCrossRef> = dao.getAllRecurrenceRuleTagCrossRefsSnapshot()

    suspend fun replaceAll(
        tasks: List<Task>,
        tags: List<Tag>,
        taskTagCrossRefs: List<TaskTagCrossRef>,
        recurrenceRules: List<RecurrenceRule>,
        recurrenceRuleTagCrossRefs: List<RecurrenceRuleTagCrossRef> = emptyList(),
    ) {
        dao.replaceAll(tasks, tags, taskTagCrossRefs, recurrenceRules, recurrenceRuleTagCrossRefs)
        notifyBackupDataChanged()
    }

    suspend fun mergeAll(
        tasks: List<Task>,
        tags: List<Tag>,
        taskTagCrossRefs: List<TaskTagCrossRef>,
        recurrenceRules: List<RecurrenceRule>,
        recurrenceRuleTagCrossRefs: List<RecurrenceRuleTagCrossRef> = emptyList(),
    ) {
        dao.mergeAll(tasks, tags, taskTagCrossRefs, recurrenceRules, recurrenceRuleTagCrossRefs)
        notifyBackupDataChanged()
    }
}
