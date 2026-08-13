package com.hvsna.app.data

data class ReminderOffsetPreset(val label: String, val minutes: Int)

val reminderOffsetPresets = listOf(
    ReminderOffsetPreset("At time of", 0),
    ReminderOffsetPreset("5 min before", 5),
    ReminderOffsetPreset("15 min before", 15),
    ReminderOffsetPreset("1 hour before", 60),
    ReminderOffsetPreset("1 day before", 1_440),
)

fun reminderFireTimeOrNull(task: Task, remindersEnabled: Boolean, nowMs: Long): Long? {
    if (!remindersEnabled || !task.reminderEnabled || task.isDone != 0) return null
    if (task.prayerName != null || task.isAllDay) return null
    val scheduledTime = task.scheduledTime ?: return null
    val fireAt = scheduledTime - task.reminderOffsetMinutes * 60_000L
    if (fireAt <= nowMs) return null
    return fireAt
}
