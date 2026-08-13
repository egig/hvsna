package com.hvsna.app.data

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query
import androidx.room.Transaction
import androidx.room.Update
import kotlinx.coroutines.flow.Flow
import java.util.UUID

@Dao
interface TaskDao {
    @Transaction
    @Query("SELECT * FROM task WHERE scheduledTime < :todayStart AND isDone = 0 AND deletedAt IS NULL ORDER BY scheduledTime ASC")
    fun getOverdue(todayStart: Long): Flow<List<TaskWithTags>>

    @Transaction
    @Query("SELECT * FROM task WHERE scheduledTime >= :todayStart AND scheduledTime < :tomorrowStart AND isDone = 0 AND deletedAt IS NULL ORDER BY scheduledTime ASC")
    fun getToday(todayStart: Long, tomorrowStart: Long): Flow<List<TaskWithTags>>

    @Transaction
    @Query("SELECT * FROM task WHERE completedTime >= :todayStart AND completedTime < :tomorrowStart AND deletedAt IS NULL ORDER BY completedTime ASC")
    fun getCompleted(todayStart: Long, tomorrowStart: Long): Flow<List<TaskWithTags>>

    @Transaction
    @Query("""
        SELECT * FROM task WHERE scheduledTime >= :tomorrowStart AND isDone = 0 AND deletedAt IS NULL
        AND (recurringTaskId IS NULL OR id = (
            SELECT t2.id FROM task t2 WHERE t2.recurringTaskId = task.recurringTaskId AND t2.isDone = 0 AND t2.deletedAt IS NULL
            ORDER BY t2.scheduledTime ASC, t2.id ASC LIMIT 1
        ))
        ORDER BY scheduledTime ASC
    """)
    fun getUpcoming(tomorrowStart: Long): Flow<List<TaskWithTags>>

    @Transaction
    @Query("SELECT * FROM task WHERE scheduledTime IS NULL AND isDone = 0 AND deletedAt IS NULL ORDER BY title ASC")
    fun getUnscheduled(): Flow<List<TaskWithTags>>

    @Transaction
    @Query("""
        SELECT * FROM task WHERE scheduledTime IS NOT NULL AND isDone = 0 AND deletedAt IS NULL
        AND (recurringTaskId IS NULL OR id = (
            SELECT t2.id FROM task t2 WHERE t2.recurringTaskId = task.recurringTaskId AND t2.isDone = 0 AND t2.deletedAt IS NULL
            ORDER BY t2.scheduledTime ASC, t2.id ASC LIMIT 1
        ))
        ORDER BY scheduledTime ASC
    """)
    fun getBrowse(): Flow<List<TaskWithTags>>

    @Transaction
    @Query("SELECT * FROM task WHERE isDone = 1 AND deletedAt IS NULL ORDER BY completedTime DESC")
    fun getAllCompleted(): Flow<List<TaskWithTags>>

    @Transaction
    @Query("""
        SELECT * FROM task WHERE title LIKE '%' || :query || '%' AND deletedAt IS NULL
        AND (
            isDone = 1
            OR recurringTaskId IS NULL
            OR id = (
                SELECT t2.id FROM task t2 WHERE t2.recurringTaskId = task.recurringTaskId AND t2.isDone = 0 AND t2.deletedAt IS NULL
                ORDER BY t2.scheduledTime ASC, t2.id ASC LIMIT 1
            )
        )
        ORDER BY scheduledTime ASC NULLS LAST
    """)
    fun search(query: String): Flow<List<TaskWithTags>>

    @Transaction
    @Query("""
        SELECT task.* FROM task
        INNER JOIN task_tag_cross_ref ON task.id = task_tag_cross_ref.taskId
        WHERE task_tag_cross_ref.tagId = :tagId AND task.isDone = 0 AND task.deletedAt IS NULL
    """)
    fun getTasksForTag(tagId: String): Flow<List<TaskWithTags>>

    @Insert
    suspend fun insert(task: Task)

    @Update
    suspend fun update(task: Task)

    @Query("UPDATE task SET deletedAt = :now, updatedAt = :now, _dirty = 1 WHERE id = :id")
    suspend fun delete(id: String, now: Long = System.currentTimeMillis())

    @Query("SELECT * FROM tag WHERE deletedAt IS NULL ORDER BY name ASC")
    fun getAllTags(): Flow<List<Tag>>

    @Insert
    suspend fun insertTag(tag: Tag)

    @Update
    suspend fun updateTag(tag: Tag)

    @Query("DELETE FROM task_tag_cross_ref WHERE tagId = :tagId")
    suspend fun clearCrossRefsForTag(tagId: String)

    @Query("UPDATE tag SET deletedAt = :now, updatedAt = :now, _dirty = 1 WHERE id = :id")
    suspend fun deleteTagById(id: String, now: Long = System.currentTimeMillis())

    @Transaction
    suspend fun deleteTag(tag: Tag) {
        clearCrossRefsForTag(tag.id)
        deleteTagById(tag.id)
    }

    @Query("SELECT COUNT(*) FROM tag WHERE deletedAt IS NULL")
    suspend fun getTagCount(): Int

    @Query("DELETE FROM task_tag_cross_ref WHERE taskId = :taskId")
    suspend fun clearTagsForTask(taskId: String)

    @Insert
    suspend fun insertTaskTagCrossRefs(crossRefs: List<TaskTagCrossRef>)

    @Transaction
    suspend fun setTagsForTask(taskId: String, tagIds: List<String>) {
        clearTagsForTask(taskId)
        insertTaskTagCrossRefs(tagIds.map { TaskTagCrossRef(taskId, it) })
    }

    @Insert
    suspend fun insertRecurrenceRule(rule: RecurrenceRule)

    @Update
    suspend fun updateRecurrenceRule(rule: RecurrenceRule)

    @Query("UPDATE recurrence_rule SET deletedAt = :now, updatedAt = :now, _dirty = 1 WHERE id = :id")
    suspend fun deleteRecurrenceRuleById(id: String, now: Long = System.currentTimeMillis())

    suspend fun deleteRecurrenceRule(rule: RecurrenceRule) = deleteRecurrenceRuleById(rule.id)

    @Query("SELECT * FROM recurrence_rule WHERE id = :id AND deletedAt IS NULL")
    suspend fun getRecurrenceRule(id: String): RecurrenceRule?

    @Query("SELECT * FROM recurrence_rule WHERE deletedAt IS NULL ORDER BY createdAt ASC")
    fun getAllRecurrenceRules(): Flow<List<RecurrenceRule>>

    @Query("SELECT COUNT(*) FROM task WHERE recurringTaskId = :recurringTaskId AND isDone = 0 AND deletedAt IS NULL")
    suspend fun countUndoneForRecurrence(recurringTaskId: String): Int

    @Query("SELECT tagId FROM task_tag_cross_ref WHERE taskId = :taskId")
    suspend fun getTagIdsForTask(taskId: String): List<String>

    @Query("SELECT * FROM task WHERE recurringTaskId = :recurringTaskId AND deletedAt IS NULL ORDER BY scheduledTime DESC, id DESC LIMIT 1")
    suspend fun getLatestTaskForRecurrence(recurringTaskId: String): Task?

    @Query("SELECT * FROM task WHERE recurringTaskId = :recurringTaskId AND isDone = 0 AND deletedAt IS NULL")
    suspend fun getUndoneTasksForRecurrence(recurringTaskId: String): List<Task>

    @Query("UPDATE task SET deletedAt = :now, updatedAt = :now, _dirty = 1 WHERE recurringTaskId = :recurringTaskId AND isDone = 0 AND deletedAt IS NULL AND id != :exceptTaskId")
    suspend fun deleteUndoneForRecurrenceExcept(recurringTaskId: String, exceptTaskId: String, now: Long = System.currentTimeMillis())

    @Query("SELECT * FROM task WHERE atTime IS NOT NULL AND atTime NOT LIKE '%:%' AND isDone = 0 AND deletedAt IS NULL")
    suspend fun getAllUndonePrayerAnchoredTasks(): List<Task>

    @Query("SELECT * FROM task WHERE reminderEnabled = 1 AND isDone = 0 AND deletedAt IS NULL")
    suspend fun getAllUndoneReminderEnabledTasks(): List<Task>

    @Query("SELECT * FROM task WHERE id = :taskId AND deletedAt IS NULL")
    suspend fun getTaskById(taskId: String): Task?

    @Query("SELECT * FROM task")
    suspend fun getAllTasksSnapshot(): List<Task>

    @Query("SELECT * FROM task_tag_cross_ref")
    suspend fun getAllTaskTagCrossRefsSnapshot(): List<TaskTagCrossRef>

    @Insert
    suspend fun insertTasks(tasks: List<Task>)

    @Insert
    suspend fun insertTags(tags: List<Tag>)

    @Insert
    suspend fun insertRecurrenceRules(rules: List<RecurrenceRule>)

    @Query("DELETE FROM task")
    suspend fun clearAllTasks()

    @Query("DELETE FROM tag")
    suspend fun clearAllTags()

    @Query("DELETE FROM task_tag_cross_ref")
    suspend fun clearAllTaskTagCrossRefs()

    @Query("DELETE FROM recurrence_rule")
    suspend fun clearAllRecurrenceRules()

    @Transaction
    suspend fun replaceAll(
        tasks: List<Task>,
        tags: List<Tag>,
        taskTagCrossRefs: List<TaskTagCrossRef>,
        recurrenceRules: List<RecurrenceRule>,
    ) {
        clearAllTaskTagCrossRefs()
        clearAllTasks()
        clearAllTags()
        clearAllRecurrenceRules()
        insertRecurrenceRules(recurrenceRules)
        insertTags(tags)
        insertTasks(tasks)
        insertTaskTagCrossRefs(taskTagCrossRefs)
    }

    @Transaction
    suspend fun mergeAll(
        tasks: List<Task>,
        tags: List<Tag>,
        taskTagCrossRefs: List<TaskTagCrossRef>,
        recurrenceRules: List<RecurrenceRule>,
    ) {
        // Ids are globally-unique uuids now, so a merge-import just needs fresh
        // ids to avoid colliding with anything already on this device — no more
        // int-rowid remapping via an `id = 0` insert sentinel.
        val recurrenceIdMap = recurrenceRules.associate { it.id to UUID.randomUUID().toString() }
        val tagIdMap = tags.associate { it.id to UUID.randomUUID().toString() }
        val taskIdMap = tasks.associate { it.id to UUID.randomUUID().toString() }

        insertRecurrenceRules(recurrenceRules.map { it.copy(id = recurrenceIdMap.getValue(it.id)) })
        insertTags(tags.map { it.copy(id = tagIdMap.getValue(it.id)) })
        insertTasks(
            tasks.map { task ->
                task.copy(
                    id = taskIdMap.getValue(task.id),
                    recurringTaskId = task.recurringTaskId?.let { recurrenceIdMap[it] },
                )
            }
        )
        val remappedCrossRefs = taskTagCrossRefs.mapNotNull { ref ->
            val newTaskId = taskIdMap[ref.taskId]
            val newTagId = tagIdMap[ref.tagId]
            if (newTaskId != null && newTagId != null) TaskTagCrossRef(newTaskId, newTagId) else null
        }
        insertTaskTagCrossRefs(remappedCrossRefs)
    }
}
