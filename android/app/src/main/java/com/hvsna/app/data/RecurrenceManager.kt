package com.hvsna.app.data

import com.hvsna.app.reminder.ReminderScheduler
import java.time.LocalDate

class RecurrenceManager(
    private val repository: TaskRepository,
    private val prayerTimesRepository: PrayerTimesRepository,
    private val reminderScheduler: ReminderScheduler,
) {
    private fun prayerEndTimeResolver(settings: AppSettings): (String, LocalDate) -> Long? = resolver@{ prayerName, date ->
        if (!settings.hasLocation) return@resolver null
        val prayers = prayerTimesRepository.getPrayerList(
            date.year, date.monthValue, date.dayOfMonth,
            settings.lat, settings.lng, settings.calculationMethod, settings.madhab,
        )
        nextPrayerTime(prayerName, prayers, stampMidnight(date))
    }

    /** Starts a series anchored on [anchorTask], which itself becomes the series' first real row. */
    suspend fun createSeries(anchorTask: Task, recurrence: RecurrenceInput, tagIds: List<String> = emptyList()): Task {
        val anchorDate = epochMillisToLocalDate(anchorTask.scheduledTime!!)
        val rule = RecurrenceRule(
            title = anchorTask.title,
            description = anchorTask.description,
            recurringType = recurrence.recurringType,
            recurringInterval = recurrence.recurringInterval,
            baseDateEpoch = stampMidnight(anchorDate),
            atTime = anchorTask.atTime,
            lat = anchorTask.lat,
            lng = anchorTask.lng,
            timezone = anchorTask.timezone,
            hijriDateOffset = anchorTask.hijriDateOffset,
            recurringEnd = recurrence.recurringEnd,
            recurringEndEpoch = recurrence.recurringEndEpoch,
            recurringEndOccurrences = recurrence.recurringEndOccurrences,
            occurrenceExceptions = serializeOccurrenceExceptions(setOf(occurrenceDateKey(anchorDate))),
            reminderEnabled = anchorTask.reminderEnabled,
            reminderOffsetMinutes = anchorTask.reminderOffsetMinutes,
        )
        repository.insertRecurrenceRule(rule)
        repository.setTagsForRule(rule.id, tagIds)
        val linkedTask = anchorTask.copy(
            recurringTaskId = rule.id,
            recurringType = rule.recurringType,
            recurringInterval = rule.recurringInterval,
        )
        repository.update(linkedTask)
        return linkedTask
    }

    /**
     * "This task only" edit scope (repeat still on): the edited occurrence
     * becomes / stays a single real row diverging from the series; the template
     * and every sibling occurrence are left untouched. Mirrors web's
     * handleScopeThisOnly (`type === "edit"`). Repeat type/interval are NOT
     * applied to a lone instance.
     */
    suspend fun editSeriesThisOnly(original: Task, edited: Task, tagIds: List<String> = emptyList()): Task {
        val linked = edited.copy(
            recurringTaskId = original.recurringTaskId,
            recurringType = original.recurringType,
            recurringInterval = original.recurringInterval,
        )
        val saved = if (original.isVirtual()) materialize(original, linked) else { repository.update(linked); linked }
        repository.setTagsForTask(saved.id, tagIds)
        return saved
    }

    /**
     * "This and all future events" edit scope: deletes only the *future*
     * pending rows of the series (past/overdue and completed rows survive),
     * then rebases the template on the edited occurrence. The template's end
     * condition (recurringEnd / *Epoch / *Occurrences) is preserved, not reset.
     * Mirrors updateRecurringSeries in packages/app.
     */
    suspend fun editSeriesAllFuture(
        recurringTaskId: String,
        original: Task,
        edited: Task,
        recurrence: RecurrenceInput,
        tagIds: List<String> = emptyList(),
    ): Task {
        val existingRule = repository.getRecurrenceRule(recurringTaskId) ?: return original
        // Anchor everything (future-sibling cutoff, template rebase, exception)
        // on the *original* occurrence's day — matching web's updateRecurringSeries,
        // which passes the un-edited `task` as the anchor even when the row's own
        // date is being changed.
        val anchorEpoch = original.scheduledTime ?: edited.scheduledTime ?: 0L
        val anchorDate = epochMillisToLocalDate(anchorEpoch)

        val target = edited.copy(
            id = if (original.isVirtual()) java.util.UUID.randomUUID().toString() else original.id,
            recurringTaskId = recurringTaskId,
            recurringType = recurrence.recurringType,
            recurringInterval = recurrence.recurringInterval,
        )
        if (original.isVirtual()) repository.insert(target) else repository.update(target)
        repository.setTagsForTask(target.id, tagIds)

        repository.deleteFuturePendingForRecurrenceExcept(recurringTaskId, target.id, anchorEpoch)

        val newExceptions = seriesEditExceptions(
            parseOccurrenceExceptions(existingRule.occurrenceExceptions),
            occurrenceDateKey(anchorDate),
        )
        val updatedRule = existingRule.copy(
            title = target.title,
            description = target.description,
            recurringType = recurrence.recurringType,
            recurringInterval = recurrence.recurringInterval,
            baseDateEpoch = stampMidnight(anchorDate),
            atTime = target.atTime,
            lat = target.lat,
            lng = target.lng,
            timezone = target.timezone,
            hijriDateOffset = target.hijriDateOffset,
            occurrenceExceptions = serializeOccurrenceExceptions(newExceptions),
            reminderEnabled = target.reminderEnabled,
            reminderOffsetMinutes = target.reminderOffsetMinutes,
            updatedAt = System.currentTimeMillis(),
            _dirty = 1,
            // recurringEnd / recurringEndEpoch / recurringEndOccurrences: intentionally
            // carried over from existingRule unchanged (web sends a partial template update).
        )
        repository.updateRecurrenceRule(updatedRule)
        repository.setTagsForRule(recurringTaskId, tagIds)
        return target
    }

    /**
     * "This task only" demote: detach a single occurrence into a standalone
     * one-off task; the series and its other occurrences continue. Mirrors
     * web's demoteTaskFromRecurring.
     */
    suspend fun demoteThisOnly(original: Task, edited: Task, tagIds: List<String> = emptyList()): Task {
        val standalone = edited.copy(
            id = if (original.isVirtual()) java.util.UUID.randomUUID().toString() else original.id,
            recurringTaskId = null,
            recurringType = null,
            recurringInterval = null,
        )
        if (original.isVirtual()) {
            original.recurringTaskId?.let { ruleId ->
                repository.getRecurrenceRule(ruleId)?.let {
                    repository.updateRecurrenceRule(addOccurrenceException(it, original.scheduledTime!!))
                }
            }
            repository.insert(standalone)
        } else {
            repository.update(standalone)
        }
        repository.setTagsForTask(standalone.id, tagIds)
        return standalone
    }

    /**
     * "This and all future events" demote: detach this occurrence, delete the
     * future pending siblings, and soft-delete the template so the series ends.
     * Past/completed rows survive. Mirrors demoteTaskFromRecurringAndDeleteFuture.
     */
    suspend fun demoteAllFuture(recurringTaskId: String, original: Task, edited: Task, tagIds: List<String> = emptyList()): Task {
        val standalone = edited.copy(
            id = if (original.isVirtual()) java.util.UUID.randomUUID().toString() else original.id,
            recurringTaskId = null,
            recurringType = null,
            recurringInterval = null,
        )
        if (original.isVirtual()) repository.insert(standalone) else repository.update(standalone)
        repository.setTagsForTask(standalone.id, tagIds)
        // Future-sibling cutoff measured from the original occurrence's day (web parity).
        val anchorEpoch = original.scheduledTime ?: edited.scheduledTime ?: 0L
        repository.deleteFuturePendingForRecurrenceExcept(recurringTaskId, standalone.id, anchorEpoch)
        repository.getRecurrenceRule(recurringTaskId)?.let { repository.deleteRecurrenceRule(it) }
        return standalone
    }

    /** Ends a series: removes every other pending row and soft-deletes the template itself. */
    suspend fun stopSeries(recurringTaskId: String, exceptTaskId: String) {
        repository.deleteUndoneForRecurrenceExcept(recurringTaskId, exceptTaskId)
        repository.getRecurrenceRule(recurringTaskId)?.let { repository.deleteRecurrenceRule(it) }
    }

    /**
     * Persists a virtual (never-before-saved) occurrence as a real row —
     * [edited] supplies the field values to save (defaults to [original]
     * unchanged), while [original]'s date is what gets recorded on the
     * template's occurrenceExceptions, since that's the slot the generator
     * must stop re-emitting regardless of whether the saved row's own date
     * was itself edited. The on-interaction counterpart to web's
     * materializeVirtualTask.
     */
    suspend fun materialize(original: Task, edited: Task = original): Task {
        val rule = repository.getRecurrenceRule(original.recurringTaskId!!)
        val real = edited.copy(id = java.util.UUID.randomUUID().toString(), recurringTaskId = original.recurringTaskId)
        repository.insert(real)
        if (rule != null) {
            repository.updateRecurrenceRule(addOccurrenceException(rule, original.scheduledTime!!))
        }
        return real
    }

    suspend fun recomputeAllPrayerAnchoredTasks(settings: AppSettings) {
        if (!settings.hasLocation) return
        val resolver = prayerEndTimeResolver(settings)
        repository.getAllUndonePrayerAnchoredTasks().forEach { task ->
            val time = task.scheduledTime ?: return@forEach
            val date = epochMillisToLocalDate(time)
            val newTime = resolver(task.atTime!!, date) ?: return@forEach
            if (newTime != task.scheduledTime) {
                val updated = task.copy(scheduledTime = newTime, updatedAt = System.currentTimeMillis(), _dirty = 1)
                repository.update(updated)
                reminderScheduler.sync(updated, settings.remindersEnabled)
            }
        }
    }

    /** Virtual occurrences for [rule] in `[fromEpoch, horizonEpoch]`, excluding dates already materialized as real rows. */
    fun virtualOccurrencesFor(rule: RecurrenceRule, fromEpoch: Long, horizonEpoch: Long, settings: AppSettings): List<Task> =
        occurrencesInRange(rule, fromEpoch, horizonEpoch, prayerEndTimeResolver(settings))

    /** The one virtual occurrence of [rule] strictly before [beforeEpoch], if any — for the Overdue screen only. */
    fun overdueOccurrenceFor(rule: RecurrenceRule, beforeEpoch: Long, settings: AppSettings): Task? =
        overdueOccurrence(rule, beforeEpoch, prayerEndTimeResolver(settings))

    fun nextOccurrenceFor(rule: RecurrenceRule, fromEpoch: Long, horizonEpoch: Long, settings: AppSettings): Task? =
        nextOccurrence(rule, fromEpoch, horizonEpoch, prayerEndTimeResolver(settings))
}
