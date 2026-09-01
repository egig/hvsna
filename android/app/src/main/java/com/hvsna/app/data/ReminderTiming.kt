package com.hvsna.app.data

data class ReminderOffsetPreset(val labelKey: String, val minutes: Int)

val reminderOffsetPresets = listOf(
    ReminderOffsetPreset("reminderPreset.atTime", 0),
    ReminderOffsetPreset("reminderPreset.min5", 5),
    ReminderOffsetPreset("reminderPreset.min15", 15),
    ReminderOffsetPreset("reminderPreset.hour1", 60),
    ReminderOffsetPreset("reminderPreset.day1", 1_440),
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
