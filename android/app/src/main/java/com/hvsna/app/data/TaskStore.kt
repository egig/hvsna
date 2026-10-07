package com.hvsna.app.data

import io.objectbox.Box
import io.objectbox.BoxStore
import io.objectbox.query.QueryBuilder
import io.objectbox.query.QueryBuilder.StringOrder
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import java.util.UUID

/**
 * Same method surface as TaskRepository (which forwards to this 1:1) — see
 * that class for the public API. Every read/write here is implemented
 * against ObjectBox's Box/QueryBuilder API.
 *
 * Lookups "by id" go through [Task.id]/[Tag.id]/[RecurrenceRule.id] (the
 * UUID, unique-indexed) rather than ObjectBox's native `boxId` — see the
 * doc comment on [Task] for why both exist. Every write that resolves an
 * existing row by that UUID must carry its `boxId` forward onto whatever
 * gets `put()` back, or ObjectBox will insert a duplicate row instead of
 * updating in place.
 */
class TaskStore(boxStore: BoxStore) {
    private val taskBox: Box<Task> = boxStore.boxFor(Task::class.java)
    private val tagBox: Box<Tag> = boxStore.boxFor(Tag::class.java)
    private val ruleBox: Box<RecurrenceRule> = boxStore.boxFor(RecurrenceRule::class.java)

    private fun findTaskEntity(id: String): Task? =
        taskBox.query().equal(Task_.id, id, StringOrder.CASE_SENSITIVE).build().use { it.findUnique() }

    private fun findTagEntity(id: String): Tag? =
        tagBox.query().equal(Tag_.id, id, StringOrder.CASE_SENSITIVE).build().use { it.findUnique() }

    private fun findRuleEntity(id: String): RecurrenceRule? =
        ruleBox.query().equal(RecurrenceRule_.id, id, StringOrder.CASE_SENSITIVE).build().use { it.findUnique() }

    private fun undoneNotDeleted() = taskBox.query().equal(Task_.isDone, 0).isNull(Task_.deletedAt)

    /** The full isDone=false/deletedAt=null universe — see RecurringSeriesReduction's doc comment for why this must stay unfiltered. */
    private fun undoneUniverseFlow(): Flow<List<Task>> = undoneNotDeleted().build().asFlow()

    private fun List<Task>.toTaskWithTags() = map { TaskWithTags(it, it.tags.toList()) }
    private fun List<RecurrenceRule>.toRuleWithTags() = map { RecurrenceRuleWithTags(it, it.tags.toList()) }

    // --- reads ---

    fun getOverdue(todayStart: Long): Flow<List<TaskWithTags>> =
        undoneNotDeleted().less(Task_.scheduledTime, todayStart)
            .order(Task_.scheduledTime).build().asFlow()
            .map { it.toTaskWithTags() }

    fun getToday(todayStart: Long, tomorrowStart: Long): Flow<List<TaskWithTags>> =
        undoneNotDeleted().greaterOrEqual(Task_.scheduledTime, todayStart).less(Task_.scheduledTime, tomorrowStart)
            .order(Task_.scheduledTime).build().asFlow()
            .map { it.toTaskWithTags() }

    fun getCompleted(todayStart: Long, tomorrowStart: Long): Flow<List<TaskWithTags>> =
        taskBox.query().isNull(Task_.deletedAt)
            .greaterOrEqual(Task_.completedTime, todayStart).less(Task_.completedTime, tomorrowStart)
            .order(Task_.completedTime).build().asFlow()
            .map { it.toTaskWithTags() }

    fun getUpcoming(tomorrowStart: Long): Flow<List<TaskWithTags>> =
        undoneUniverseFlow().map { universe ->
            collapseToLeadOccurrencePerSeries(universe)
                .filter { it.scheduledTime != null && it.scheduledTime >= tomorrowStart }
                .sortedBy { it.scheduledTime }
                .toTaskWithTags()
        }

    fun getUnscheduled(): Flow<List<TaskWithTags>> =
        undoneNotDeleted().isNull(Task_.scheduledTime)
            .order(Task_.title).build().asFlow()
            .map { it.toTaskWithTags() }

    fun getBrowse(): Flow<List<TaskWithTags>> =
        undoneUniverseFlow().map { universe ->
            collapseToLeadOccurrencePerSeries(universe)
                .filter { it.scheduledTime != null }
                .sortedBy { it.scheduledTime }
                .toTaskWithTags()
        }

    fun getAllCompleted(): Flow<List<TaskWithTags>> =
        taskBox.query().equal(Task_.isDone, 1).isNull(Task_.deletedAt)
            .order(Task_.completedTime, QueryBuilder.DESCENDING).build().asFlow()
            .map { it.toTaskWithTags() }

    fun search(query: String): Flow<List<TaskWithTags>> =
        undoneUniverseFlow().map { universe ->
            collapseToLeadOccurrencePerSeries(universe)
                .filter { it.title.contains(query, ignoreCase = true) || it.description.contains(query, ignoreCase = true) }
                .sortedWith(compareBy(nullsLast()) { it.scheduledTime })
                .toTaskWithTags()
        }

    fun getTasksForTag(tagId: String): Flow<List<TaskWithTags>> =
        undoneUniverseFlow().map { universe ->
            universe.filter { task -> task.tags.any { it.id == tagId } }.toTaskWithTags()
        }

    fun getAllTags(): Flow<List<Tag>> =
        tagBox.query().isNull(Tag_.deletedAt).order(Tag_.name).build().asFlow()

    // --- writes ---

    suspend fun insert(task: Task) {
        taskBox.put(task)
    }

    suspend fun update(task: Task) {
        val existing = findTaskEntity(task.id)
        taskBox.put(if (existing != null) task.copy(boxId = existing.boxId) else task)
    }

    suspend fun delete(id: String, now: Long = System.currentTimeMillis()) {
        val existing = findTaskEntity(id) ?: return
        taskBox.put(existing.copy(deletedAt = now, updatedAt = now, _dirty = 1))
    }

    suspend fun insertTag(tag: Tag) {
        tagBox.put(tag)
    }

    suspend fun updateTag(tag: Tag) {
        val existing = findTagEntity(tag.id)
        tagBox.put(if (existing != null) tag.copy(boxId = existing.boxId) else tag)
    }

    suspend fun deleteTag(tag: Tag, now: Long = System.currentTimeMillis()) {
        val existing = findTagEntity(tag.id) ?: return
        clearCrossRefsForTag(tag.id)
        tagBox.put(existing.copy(deletedAt = now, updatedAt = now, _dirty = 1))
    }

    private fun clearCrossRefsForTag(tagId: String) {
        taskBox.query().isNull(Task_.deletedAt).build().use { query ->
            query.find().forEach { task ->
                if (task.tags.any { it.id == tagId }) {
                    task.tags.removeAll { it.id == tagId }
                    task.tags.applyChangesToDb()
                }
            }
        }
        ruleBox.query().isNull(RecurrenceRule_.deletedAt).build().use { query ->
            query.find().forEach { rule ->
                if (rule.tags.any { it.id == tagId }) {
                    rule.tags.removeAll { it.id == tagId }
                    rule.tags.applyChangesToDb()
                }
            }
        }
    }

    suspend fun getTagCount(): Int =
        tagBox.query().isNull(Tag_.deletedAt).build().use { it.count().toInt() }

    suspend fun setTagsForTask(taskId: String, tagIds: List<String>) {
        val task = findTaskEntity(taskId) ?: return
        val tags = tagIds.mapNotNull { findTagEntity(it) }
        task.tags.clear()
        task.tags.addAll(tags)
        task.tags.applyChangesToDb()
    }

    suspend fun insertRecurrenceRule(rule: RecurrenceRule) {
        ruleBox.put(rule)
    }

    suspend fun updateRecurrenceRule(rule: RecurrenceRule) {
        val existing = findRuleEntity(rule.id)
        ruleBox.put(if (existing != null) rule.copy(boxId = existing.boxId) else rule)
    }

    suspend fun deleteRecurrenceRule(rule: RecurrenceRule, now: Long = System.currentTimeMillis()) {
        val existing = findRuleEntity(rule.id) ?: return
        ruleBox.put(existing.copy(deletedAt = now, updatedAt = now, _dirty = 1))
    }

    suspend fun getRecurrenceRule(id: String): RecurrenceRule? =
        findRuleEntity(id)?.takeIf { it.deletedAt == null }

    fun getAllRecurrenceRules(): Flow<List<RecurrenceRule>> =
        ruleBox.query().isNull(RecurrenceRule_.deletedAt).order(RecurrenceRule_.createdAt).build().asFlow()

    fun getAllRecurrenceRulesWithTags(): Flow<List<RecurrenceRuleWithTags>> =
        ruleBox.query().isNull(RecurrenceRule_.deletedAt).order(RecurrenceRule_.createdAt).build().asFlow()
            .map { it.toRuleWithTags() }

    suspend fun countUndoneForRecurrence(recurringTaskId: String): Int =
        undoneNotDeleted().equal(Task_.recurringTaskId, recurringTaskId, StringOrder.CASE_SENSITIVE)
            .build().use { it.count().toInt() }

    suspend fun getTagIdsForTask(taskId: String): List<String> =
        findTaskEntity(taskId)?.tags?.map { it.id } ?: emptyList()

    suspend fun getTagIdsForRule(ruleId: String): List<String> =
        findRuleEntity(ruleId)?.tags?.map { it.id } ?: emptyList()

    suspend fun setTagsForRule(ruleId: String, tagIds: List<String>) {
        val rule = findRuleEntity(ruleId) ?: return
        val tags = tagIds.mapNotNull { findTagEntity(it) }
        rule.tags.clear()
        rule.tags.addAll(tags)
        rule.tags.applyChangesToDb()
    }

    suspend fun getLatestTaskForRecurrence(recurringTaskId: String): Task? =
        taskBox.query().equal(Task_.recurringTaskId, recurringTaskId, StringOrder.CASE_SENSITIVE).isNull(Task_.deletedAt)
            .build().use { it.find() }
            .maxWithOrNull(leadOccurrenceOrder)

    suspend fun getUndoneTasksForRecurrence(recurringTaskId: String): List<Task> =
        undoneNotDeleted().equal(Task_.recurringTaskId, recurringTaskId, StringOrder.CASE_SENSITIVE).build().use { it.find() }

    suspend fun deleteUndoneForRecurrenceExcept(recurringTaskId: String, exceptTaskId: String, now: Long = System.currentTimeMillis()) {
        val rows = undoneNotDeleted().equal(Task_.recurringTaskId, recurringTaskId, StringOrder.CASE_SENSITIVE)
            .build().use { it.find() }
        val updated = rows.filter { it.id != exceptTaskId }
            .map { it.copy(deletedAt = now, updatedAt = now, _dirty = 1) }
        taskBox.put(updated)
    }

    /**
     * Soft-deletes only the *future* pending occurrences of a series
     * (scheduledTime >= fromEpoch), leaving past/overdue and completed rows
     * alone — mirrors the `epoch >= task epoch` filter in packages/app's
     * updateRecurringSeries / demoteTaskFromRecurringAndDeleteFuture.
     */
    suspend fun deleteFuturePendingForRecurrenceExcept(
        recurringTaskId: String,
        exceptTaskId: String,
        fromEpoch: Long,
        now: Long = System.currentTimeMillis(),
    ) {
        val rows = undoneNotDeleted().equal(Task_.recurringTaskId, recurringTaskId, StringOrder.CASE_SENSITIVE)
            .build().use { it.find() }
        val updated = rows
            .filter { it.id != exceptTaskId && (it.scheduledTime == null || it.scheduledTime >= fromEpoch) }
            .map { it.copy(deletedAt = now, updatedAt = now, _dirty = 1) }
        taskBox.put(updated)
    }

    suspend fun getAllUndonePrayerAnchoredTasks(): List<Task> =
        undoneNotDeleted().build().use { it.find() }
            .filter { !it.atTime.isNullOrBlank() && !it.atTime.contains(":") }

    suspend fun getAllUndoneReminderEnabledTasks(): List<Task> =
        undoneNotDeleted().equal(Task_.reminderEnabled, true).build().use { it.find() }

    suspend fun getTaskById(taskId: String): Task? = findTaskEntity(taskId)?.takeIf { it.deletedAt == null }

    suspend fun getAllTasksSnapshot(): List<Task> = taskBox.all

    suspend fun getAllTaskTagCrossRefsSnapshot(): List<TaskTagCrossRef> =
        taskBox.all.flatMap { task -> task.tags.map { tag -> TaskTagCrossRef(task.id, tag.id) } }

    suspend fun getAllRecurrenceRuleTagCrossRefsSnapshot(): List<RecurrenceRuleTagCrossRef> =
        ruleBox.all.flatMap { rule -> rule.tags.map { tag -> RecurrenceRuleTagCrossRef(rule.id, tag.id) } }

    suspend fun replaceAll(
        tasks: List<Task>,
        tags: List<Tag>,
        taskTagCrossRefs: List<TaskTagCrossRef>,
        recurrenceRules: List<RecurrenceRule>,
        recurrenceRuleTagCrossRefs: List<RecurrenceRuleTagCrossRef> = emptyList(),
    ) {
        taskBox.removeAll()
        tagBox.removeAll()
        ruleBox.removeAll()
        ruleBox.put(recurrenceRules)
        tagBox.put(tags)
        taskBox.put(tasks)
        linkCrossRefs(taskTagCrossRefs, recurrenceRuleTagCrossRefs)
    }

    suspend fun mergeAll(
        tasks: List<Task>,
        tags: List<Tag>,
        taskTagCrossRefs: List<TaskTagCrossRef>,
        recurrenceRules: List<RecurrenceRule>,
        recurrenceRuleTagCrossRefs: List<RecurrenceRuleTagCrossRef> = emptyList(),
    ) {
        // Ids are globally-unique uuids, so a merge-import just needs fresh ids to
        // avoid colliding with anything already on this device.
        val recurrenceIdMap = recurrenceRules.associate { it.id to UUID.randomUUID().toString() }
        val tagIdMap = tags.associate { it.id to UUID.randomUUID().toString() }
        val taskIdMap = tasks.associate { it.id to UUID.randomUUID().toString() }

        ruleBox.put(recurrenceRules.map { it.copy(id = recurrenceIdMap.getValue(it.id), boxId = 0) })
        tagBox.put(tags.map { it.copy(id = tagIdMap.getValue(it.id), boxId = 0) })
        taskBox.put(
            tasks.map { task ->
                task.copy(
                    id = taskIdMap.getValue(task.id),
                    recurringTaskId = task.recurringTaskId?.let { recurrenceIdMap[it] },
                    boxId = 0,
                )
            },
        )
        val remappedCrossRefs = taskTagCrossRefs.mapNotNull { ref ->
            val newTaskId = taskIdMap[ref.taskId]
            val newTagId = tagIdMap[ref.tagId]
            if (newTaskId != null && newTagId != null) TaskTagCrossRef(newTaskId, newTagId) else null
        }
        val remappedRuleCrossRefs = recurrenceRuleTagCrossRefs.mapNotNull { ref ->
            val newRuleId = recurrenceIdMap[ref.ruleId]
            val newTagId = tagIdMap[ref.tagId]
            if (newRuleId != null && newTagId != null) RecurrenceRuleTagCrossRef(newRuleId, newTagId) else null
        }
        linkCrossRefs(remappedCrossRefs, remappedRuleCrossRefs)
    }

    private fun linkCrossRefs(taskTagCrossRefs: List<TaskTagCrossRef>, recurrenceRuleTagCrossRefs: List<RecurrenceRuleTagCrossRef>) {
        taskTagCrossRefs.groupBy { it.taskId }.forEach { (taskId, refs) ->
            val task = findTaskEntity(taskId) ?: return@forEach
            val tags = refs.mapNotNull { findTagEntity(it.tagId) }
            task.tags.addAll(tags)
            task.tags.applyChangesToDb()
        }
        recurrenceRuleTagCrossRefs.groupBy { it.ruleId }.forEach { (ruleId, refs) ->
            val rule = findRuleEntity(ruleId) ?: return@forEach
            val tags = refs.mapNotNull { findTagEntity(it.tagId) }
            rule.tags.addAll(tags)
            rule.tags.applyChangesToDb()
        }
    }
}
