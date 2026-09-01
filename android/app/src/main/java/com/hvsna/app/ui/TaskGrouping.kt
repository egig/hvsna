package com.hvsna.app.ui

import com.hvsna.app.data.RecurringType
import com.hvsna.app.data.TaskWithTags
import com.hvsna.app.i18n.Strings
import java.text.SimpleDateFormat
import java.util.Calendar

data class TaskGroup(val key: String, val label: String, val tasks: List<TaskWithTags>)

data class TodayGroupedTasks(
    val overdue: List<TaskWithTags>,
    val today: List<TaskWithTags>,
    val tomorrow: List<TaskWithTags>,
)

private fun startOfDay(base: Calendar): Calendar = (base.clone() as Calendar).apply {
    set(Calendar.HOUR_OF_DAY, 0)
    set(Calendar.MINUTE, 0)
    set(Calendar.SECOND, 0)
    set(Calendar.MILLISECOND, 0)
}

private fun endOfDay(base: Calendar): Calendar = (base.clone() as Calendar).apply {
    set(Calendar.HOUR_OF_DAY, 23)
    set(Calendar.MINUTE, 59)
    set(Calendar.SECOND, 59)
    set(Calendar.MILLISECOND, 999)
}

/**
 * Buckets tasks the same way the web app's upcoming screen does: fixed
 * today/tomorrow/thisWeek/thisMonth groups, then anything further out grouped
 * by Gregorian month (same year) or year (future years), sorted ascending.
 * Empty groups are dropped by the caller.
 */
fun groupUpcomingTasks(tasks: List<TaskWithTags>, strings: Strings): List<TaskGroup> {
    val monthYearFormat = SimpleDateFormat("MMMM yyyy", strings.locale)
    val yearFormat = SimpleDateFormat("yyyy", strings.locale)
    val now = Calendar.getInstance()
    val startOfToday = startOfDay(now)
    val endOfToday = endOfDay(now)
    val startOfTomorrow = (startOfToday.clone() as Calendar).apply { add(Calendar.DAY_OF_MONTH, 1) }
    val endOfTomorrow = (endOfToday.clone() as Calendar).apply { add(Calendar.DAY_OF_MONTH, 1) }
    val endOfWeek = endOfDay((startOfToday.clone() as Calendar).apply {
        add(Calendar.DAY_OF_MONTH, Calendar.SATURDAY - get(Calendar.DAY_OF_WEEK))
    })
    val endOfMonth = endOfDay((startOfToday.clone() as Calendar).apply {
        set(Calendar.DAY_OF_MONTH, getActualMaximum(Calendar.DAY_OF_MONTH))
    })

    val today = mutableListOf<TaskWithTags>()
    val tomorrow = mutableListOf<TaskWithTags>()
    val thisWeek = mutableListOf<TaskWithTags>()
    val thisMonth = mutableListOf<TaskWithTags>()
    val laterMap = linkedMapOf<String, Pair<String, MutableList<TaskWithTags>>>()

    // Daily/weekly recurring tasks can produce many occurrences inside a
    // single coarse group (e.g. every day of "this month") — only surface
    // the earliest occurrence per series within each group.
    val seenRecurringPerGroup = mutableMapOf<String, MutableSet<String>>()
    fun pushToGroup(groupKey: String, bucket: MutableList<TaskWithTags>, entry: TaskWithTags) {
        val recurringType = entry.task.recurringType
        val recurringTaskId = entry.task.recurringTaskId
        if ((recurringType == RecurringType.DAILY || recurringType == RecurringType.WEEKLY) && recurringTaskId != null) {
            val seen = seenRecurringPerGroup.getOrPut(groupKey) { mutableSetOf() }
            if (!seen.add(recurringTaskId)) return
        }
        bucket.add(entry)
    }

    tasks.forEach { entry ->
        val t = entry.task.scheduledTime ?: return@forEach
        when {
            t in startOfToday.timeInMillis..endOfToday.timeInMillis -> pushToGroup("today", today, entry)
            t in startOfTomorrow.timeInMillis..endOfTomorrow.timeInMillis -> pushToGroup("tomorrow", tomorrow, entry)
            t > endOfTomorrow.timeInMillis && t <= endOfWeek.timeInMillis -> pushToGroup("thisWeek", thisWeek, entry)
            t > endOfWeek.timeInMillis && t <= endOfMonth.timeInMillis -> pushToGroup("thisMonth", thisMonth, entry)
            else -> {
                val taskCal = Calendar.getInstance().apply { timeInMillis = t }
                val key: String
                val label: String
                if (taskCal.get(Calendar.YEAR) == now.get(Calendar.YEAR)) {
                    val month = (taskCal.get(Calendar.MONTH) + 1).toString().padStart(2, '0')
                    key = "month_${taskCal.get(Calendar.YEAR)}_$month"
                    label = monthYearFormat.format(taskCal.time)
                } else {
                    key = "year_${taskCal.get(Calendar.YEAR)}"
                    label = yearFormat.format(taskCal.time)
                }
                val group = laterMap.getOrPut(key) { label to mutableListOf() }
                pushToGroup(key, group.second, entry)
            }
        }
    }

    val laterGroups = laterMap.entries
        .sortedBy { it.key }
        .map { (key, value) -> TaskGroup(key, value.first, value.second) }

    return listOf(
        TaskGroup("today", strings["group.today"], today),
        TaskGroup("tomorrow", strings["group.tomorrow"], tomorrow),
        TaskGroup("thisWeek", strings["group.thisWeek"], thisWeek),
        TaskGroup("thisMonth", strings["group.thisMonth"], thisMonth),
    ) + laterGroups
}

/**
 * Buckets the Today screen's tasks into overdue / today / tomorrow, mirroring
 * the web app's groupTasksByPrayerTimes + Maghrib day-rollover (use-today.ts):
 * a task whose clock time has already passed today is overdue even though
 * [TaskViewModel.getToday] fetched it as "on time", and anything scheduled
 * past [todayEndEpoch] only shows up in [todayWindowTasks] once the caller
 * has extended the fetch window past today's Maghrib.
 */
fun groupTodayTasks(
    baseOverdue: List<TaskWithTags>,
    todayWindowTasks: List<TaskWithTags>,
    now: Long,
    todayEndEpoch: Long,
): TodayGroupedTasks {
    val (timeOverdue, active) = todayWindowTasks.partition {
        !it.task.atTime.isNullOrBlank() && (it.task.scheduledTime ?: Long.MAX_VALUE) < now
    }
    val overdue = (baseOverdue + timeOverdue).sortedBy { it.task.scheduledTime ?: Long.MAX_VALUE }
    val (today, tomorrow) = active.partition { (it.task.scheduledTime ?: 0L) <= todayEndEpoch }
    return TodayGroupedTasks(overdue, today, tomorrow)
}
