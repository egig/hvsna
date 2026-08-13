package com.hvsna.app.data

import com.hvsna.app.reminder.ReminderScheduler
import kotlinx.coroutines.flow.first
import java.time.LocalDate
import java.util.Calendar

class RecurrenceManager(
    private val repository: TaskRepository,
    private val prayerTimesRepository: PrayerTimesRepository,
    private val reminderScheduler: ReminderScheduler,
) {
    companion object {
        const val MATERIALIZATION_WINDOW = 10
    }

    suspend fun createSeries(
        anchorTask: Task,
        intervalCount: Int,
        unit: RecurrenceUnit,
        settings: AppSettings,
    ): Task {
        val anchorDate = epochMillisToLocalDate(anchorTask.scheduledTime!!)
        val clockTime = clockTimeOf(anchorTask)
        val rule = RecurrenceRule(
            title = anchorTask.title,
            description = anchorTask.description,
            intervalCount = intervalCount,
            unit = unit.name,
            anchorEpochDay = anchorDate.toEpochDay(),
            nextOccurrenceIndex = 1,
            hour = clockTime?.get(Calendar.HOUR_OF_DAY),
            minute = clockTime?.get(Calendar.MINUTE),
            prayerName = anchorTask.prayerName,
            isAllDay = anchorTask.isAllDay,
            reminderEnabled = anchorTask.reminderEnabled,
            reminderOffsetMinutes = anchorTask.reminderOffsetMinutes,
        )
        val ruleId = repository.insertRecurrenceRule(rule).toInt()
        val linkedTask = anchorTask.copy(recurrenceId = ruleId)
        repository.update(linkedTask)
        materializeOne(rule.copy(id = ruleId), settings)
        return linkedTask
    }

    suspend fun updateSeries(
        recurrenceId: Int,
        editedTask: Task,
        intervalCount: Int,
        unit: RecurrenceUnit,
        tagIds: List<Int>,
        settings: AppSettings,
    ) {
        val existingRule = repository.getRecurrenceRule(recurrenceId) ?: return
        val anchorDate = epochMillisToLocalDate(editedTask.scheduledTime!!)
        val clockTime = clockTimeOf(editedTask)
        val updatedRule = existingRule.copy(
            title = editedTask.title,
            description = editedTask.description,
            intervalCount = intervalCount,
            unit = unit.name,
            anchorEpochDay = anchorDate.toEpochDay(),
            nextOccurrenceIndex = 1,
            hour = clockTime?.get(Calendar.HOUR_OF_DAY),
            minute = clockTime?.get(Calendar.MINUTE),
            prayerName = editedTask.prayerName,
            isAllDay = editedTask.isAllDay,
            reminderEnabled = editedTask.reminderEnabled,
            reminderOffsetMinutes = editedTask.reminderOffsetMinutes,
        )
        repository.updateRecurrenceRule(updatedRule)

        repository.getUndoneTasksForRecurrence(recurrenceId)
            .filter { it.id != editedTask.id }
            .forEach { other ->
                repository.update(other.copy(title = editedTask.title, description = editedTask.description))
                repository.setTagsForTask(other.id, tagIds)
            }

        materializeOne(updatedRule, settings)
    }

    suspend fun stopSeries(recurrenceId: Int, exceptTaskId: Int) {
        repository.deleteUndoneForRecurrenceExcept(recurrenceId, exceptTaskId)
        repository.getRecurrenceRule(recurrenceId)?.let { repository.deleteRecurrenceRule(it) }
    }

    suspend fun materializeAll(settings: AppSettings) {
        repository.getAllRecurrenceRules().first().forEach { rule -> materializeOne(rule, settings) }
    }

    suspend fun recomputeAllPrayerAnchoredTasks(settings: AppSettings) {
        if (!settings.hasLocation) return
        repository.getAllUndonePrayerPinnedTasks().forEach { task ->
            val time = task.scheduledTime ?: return@forEach
            val date = epochMillisToLocalDate(time)
            val prayers = prayerTimesRepository.getPrayerList(
                date.year, date.monthValue, date.dayOfMonth,
                settings.lat, settings.lng, settings.calculationMethod, settings.madhab,
            )
            val newTime = nextPrayerTime(task.prayerName!!, prayers, stampMidnight(date))
            if (newTime != task.scheduledTime) repository.update(task.copy(scheduledTime = newTime))
        }
    }

    private suspend fun materializeOne(rule: RecurrenceRule, settings: AppSettings) {
        var undoneCount = repository.countUndoneForRecurrence(rule.id)
        if (undoneCount >= MATERIALIZATION_WINDOW) return
        val latest = repository.getLatestTaskForRecurrence(rule.id) ?: return
        val tagIds = repository.getTagIdsForTask(latest.id)
        val unit = RecurrenceUnit.valueOf(rule.unit)
        val anchorDate = LocalDate.ofEpochDay(rule.anchorEpochDay)
        var index = rule.nextOccurrenceIndex
        while (undoneCount < MATERIALIZATION_WINDOW) {
            val date = occurrenceDate(anchorDate, rule.intervalCount, unit, index)
            val newTask = Task(
                title = rule.title,
                description = rule.description,
                scheduledTime = resolveScheduledTime(date, rule, settings),
                prayerName = rule.prayerName,
                isAllDay = rule.isAllDay,
                recurrenceId = rule.id,
                reminderEnabled = rule.reminderEnabled,
                reminderOffsetMinutes = rule.reminderOffsetMinutes,
            )
            val newTaskId = repository.insert(newTask).toInt()
            repository.setTagsForTask(newTaskId, tagIds)
            reminderScheduler.sync(newTask.copy(id = newTaskId), settings.remindersEnabled)
            index++
            undoneCount++
        }
        repository.updateRecurrenceRule(rule.copy(nextOccurrenceIndex = index))
    }

    private fun resolveScheduledTime(date: LocalDate, rule: RecurrenceRule, settings: AppSettings): Long = when {
        rule.prayerName != null && settings.hasLocation -> {
            val prayers = prayerTimesRepository.getPrayerList(
                date.year, date.monthValue, date.dayOfMonth,
                settings.lat, settings.lng, settings.calculationMethod, settings.madhab,
            )
            nextPrayerTime(rule.prayerName, prayers, stampMidnight(date))
        }
        rule.prayerName != null -> stampAllDay(date)
        rule.isAllDay -> stampAllDay(date)
        else -> stampClockTime(date, rule.hour ?: 0, rule.minute ?: 0)
    }

    private fun clockTimeOf(task: Task): Calendar? =
        if (task.prayerName == null && !task.isAllDay) {
            Calendar.getInstance().apply { timeInMillis = task.scheduledTime!! }
        } else {
            null
        }
}
