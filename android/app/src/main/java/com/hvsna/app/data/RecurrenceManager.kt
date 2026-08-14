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
     * "This and all future occurrences" edit scope: deletes every other
     * pending (undone) materialized row for the series, then rebases the
     * template on [editedTask] so the generator's virtual stream restarts
     * cleanly from here — mirrors updateRecurringSeries in packages/app.
     * Completed past instances are left untouched.
     */
    suspend fun updateSeries(recurringTaskId: String, editedTask: Task, recurrence: RecurrenceInput, tagIds: List<String> = emptyList()) {
        val existingRule = repository.getRecurrenceRule(recurringTaskId) ?: return
        repository.deleteUndoneForRecurrenceExcept(recurringTaskId, exceptTaskId = editedTask.id)
        val anchorDate = epochMillisToLocalDate(editedTask.scheduledTime!!)
        val updatedRule = existingRule.copy(
            title = editedTask.title,
            description = editedTask.description,
            recurringType = recurrence.recurringType,
            recurringInterval = recurrence.recurringInterval,
            baseDateEpoch = stampMidnight(anchorDate),
            atTime = editedTask.atTime,
            lat = editedTask.lat,
            lng = editedTask.lng,
            timezone = editedTask.timezone,
            hijriDateOffset = editedTask.hijriDateOffset,
            recurringEnd = recurrence.recurringEnd,
            recurringEndEpoch = recurrence.recurringEndEpoch,
            recurringEndOccurrences = recurrence.recurringEndOccurrences,
            occurrenceExceptions = serializeOccurrenceExceptions(setOf(occurrenceDateKey(anchorDate))),
            reminderEnabled = editedTask.reminderEnabled,
            reminderOffsetMinutes = editedTask.reminderOffsetMinutes,
        )
        repository.updateRecurrenceRule(updatedRule)
        repository.setTagsForRule(updatedRule.id, tagIds)
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
