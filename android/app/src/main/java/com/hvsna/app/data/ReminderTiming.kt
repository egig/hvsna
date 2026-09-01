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
    // No reminder for all-day (atTime null) or prayer-anchored tasks — there's
    // no single fixed clock instant to schedule an exact alarm against ahead of time.
    if (task.atTime.isNullOrBlank() || isPrayerAnchored(task.atTime)) return null
    val scheduledTime = task.scheduledTime ?: return null
    val fireAt = scheduledTime - task.reminderOffsetMinutes * 60_000L
    if (fireAt <= nowMs) return null
    return fireAt
}
