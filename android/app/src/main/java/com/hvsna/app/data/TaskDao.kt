package com.hvsna.app.data

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.Query
import androidx.room.Transaction
import androidx.room.Update
import kotlinx.coroutines.flow.Flow

@Dao
interface TaskDao {
    @Transaction
    @Query("SELECT * FROM task WHERE scheduledTime < :todayStart AND isDone = 0 ORDER BY scheduledTime ASC")
    fun getOverdue(todayStart: Long): Flow<List<TaskWithTags>>

    @Transaction
    @Query("SELECT * FROM task WHERE scheduledTime >= :todayStart AND scheduledTime < :tomorrowStart AND isDone = 0 ORDER BY scheduledTime ASC")
    fun getToday(todayStart: Long, tomorrowStart: Long): Flow<List<TaskWithTags>>

    @Transaction
    @Query("SELECT * FROM task WHERE completedTime >= :todayStart AND completedTime < :tomorrowStart ORDER BY completedTime ASC")
    fun getCompleted(todayStart: Long, tomorrowStart: Long): Flow<List<TaskWithTags>>

    @Transaction
    @Query("""
        SELECT * FROM task WHERE scheduledTime >= :tomorrowStart AND isDone = 0
        AND (recurrenceId IS NULL OR id = (
            SELECT t2.id FROM task t2 WHERE t2.recurrenceId = task.recurrenceId AND t2.isDone = 0
            ORDER BY t2.scheduledTime ASC, t2.id ASC LIMIT 1
        ))
        ORDER BY scheduledTime ASC
    """)
    fun getUpcoming(tomorrowStart: Long): Flow<List<TaskWithTags>>

    @Transaction
    @Query("SELECT * FROM task WHERE scheduledTime IS NULL AND isDone = 0 ORDER BY title ASC")
    fun getUnscheduled(): Flow<List<TaskWithTags>>

    @Transaction
    @Query("""
        SELECT * FROM task WHERE scheduledTime IS NOT NULL AND isDone = 0
        AND (recurrenceId IS NULL OR id = (
            SELECT t2.id FROM task t2 WHERE t2.recurrenceId = task.recurrenceId AND t2.isDone = 0
            ORDER BY t2.scheduledTime ASC, t2.id ASC LIMIT 1
        ))
        ORDER BY scheduledTime ASC
    """)
    fun getBrowse(): Flow<List<TaskWithTags>>

    @Transaction
    @Query("SELECT * FROM task WHERE isDone = 1 ORDER BY completedTime DESC")
    fun getAllCompleted(): Flow<List<TaskWithTags>>

    @Transaction
    @Query("""
        SELECT * FROM task WHERE title LIKE '%' || :query || '%'
        AND (
            isDone = 1
            OR recurrenceId IS NULL
            OR id = (
                SELECT t2.id FROM task t2 WHERE t2.recurrenceId = task.recurrenceId AND t2.isDone = 0
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
        WHERE task_tag_cross_ref.tagId = :tagId AND task.isDone = 0
    """)
    fun getTasksForTag(tagId: Int): Flow<List<TaskWithTags>>

    @Insert
    suspend fun insert(task: Task): Long

    @Update
    suspend fun update(task: Task)

    @Delete
    suspend fun delete(task: Task)

    @Query("SELECT * FROM tag ORDER BY name ASC")
    fun getAllTags(): Flow<List<Tag>>

    @Insert
    suspend fun insertTag(tag: Tag): Long

    @Update
    suspend fun updateTag(tag: Tag)

    @Delete
    suspend fun deleteTag(tag: Tag)

    @Query("SELECT COUNT(*) FROM tag")
    suspend fun getTagCount(): Int

    @Query("DELETE FROM task_tag_cross_ref WHERE taskId = :taskId")
    suspend fun clearTagsForTask(taskId: Int)

    @Insert
    suspend fun insertTaskTagCrossRefs(crossRefs: List<TaskTagCrossRef>)

    @Transaction
    suspend fun setTagsForTask(taskId: Int, tagIds: List<Int>) {
        clearTagsForTask(taskId)
        insertTaskTagCrossRefs(tagIds.map { TaskTagCrossRef(taskId, it) })
    }

    @Insert
    suspend fun insertRecurrenceRule(rule: RecurrenceRule): Long

    @Update
    suspend fun updateRecurrenceRule(rule: RecurrenceRule)

    @Delete
    suspend fun deleteRecurrenceRule(rule: RecurrenceRule)

    @Query("SELECT * FROM recurrence_rule WHERE id = :id")
    suspend fun getRecurrenceRule(id: Int): RecurrenceRule?

    @Query("SELECT * FROM recurrence_rule ORDER BY id ASC")
    fun getAllRecurrenceRules(): Flow<List<RecurrenceRule>>

    @Query("SELECT COUNT(*) FROM task WHERE recurrenceId = :recurrenceId AND isDone = 0")
    suspend fun countUndoneForRecurrence(recurrenceId: Int): Int

    @Query("SELECT COUNT(*) FROM task WHERE recurrenceId = :recurrenceId")
    suspend fun countAllForRecurrence(recurrenceId: Int): Int

    @Query("SELECT tagId FROM task_tag_cross_ref WHERE taskId = :taskId")
    suspend fun getTagIdsForTask(taskId: Int): List<Int>

    @Query("SELECT * FROM task WHERE recurrenceId = :recurrenceId ORDER BY scheduledTime DESC, id DESC LIMIT 1")
    suspend fun getLatestTaskForRecurrence(recurrenceId: Int): Task?

    @Query("SELECT * FROM task WHERE recurrenceId = :recurrenceId AND isDone = 0")
    suspend fun getUndoneTasksForRecurrence(recurrenceId: Int): List<Task>

    @Query("DELETE FROM task WHERE recurrenceId = :recurrenceId AND isDone = 0 AND id != :exceptTaskId")
    suspend fun deleteUndoneForRecurrenceExcept(recurrenceId: Int, exceptTaskId: Int)

    @Query("SELECT * FROM task WHERE prayerName IS NOT NULL AND isDone = 0")
    suspend fun getAllUndonePrayerPinnedTasks(): List<Task>

    @Query("SELECT * FROM task WHERE reminderEnabled = 1 AND isDone = 0")
    suspend fun getAllUndoneReminderEnabledTasks(): List<Task>

    @Query("SELECT * FROM task WHERE id = :taskId")
    suspend fun getTaskById(taskId: Int): Task?

    @Transaction
    @Query("""
        SELECT task.* FROM task WHERE task.recurrenceId IS NOT NULL AND task.isDone = 0
        AND task.id = (
            SELECT t2.id FROM task t2 WHERE t2.recurrenceId = task.recurrenceId AND t2.isDone = 0
            ORDER BY t2.scheduledTime ASC, t2.id ASC LIMIT 1
        )
    """)
    fun getNextOccurrencePerSeries(): Flow<List<TaskWithTags>>

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
        val recurrenceIdMap = recurrenceRules.associate { it.id to insertRecurrenceRule(it.copy(id = 0)).toInt() }
        val tagIdMap = tags.associate { it.id to insertTag(it.copy(id = 0)).toInt() }
        val taskIdMap = tasks.associate { task ->
            val remappedRecurrenceId = task.recurrenceId?.let { recurrenceIdMap[it] }
            task.id to insert(task.copy(id = 0, recurrenceId = remappedRecurrenceId)).toInt()
        }
        val remappedCrossRefs = taskTagCrossRefs.mapNotNull { ref ->
            val newTaskId = taskIdMap[ref.taskId]
            val newTagId = tagIdMap[ref.tagId]
            if (newTaskId != null && newTagId != null) TaskTagCrossRef(newTaskId, newTagId) else null
        }
        insertTaskTagCrossRefs(remappedCrossRefs)
    }
}
