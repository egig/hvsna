package com.hvsna.app.data

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class ReminderTimingTest {

    private val now = 1_000_000_000L
    private val baseTask = Task(
        id = 1,
        title = "Test",
        description = "",
        scheduledTime = now + 3_600_000L, // 1 hour from now
        reminderEnabled = true,
        reminderOffsetMinutes = 0,
    )

    @Test
    fun `at time of preset fires exactly at scheduledTime`() {
        assertEquals(baseTask.scheduledTime, reminderFireTimeOrNull(baseTask, remindersEnabled = true, nowMs = now))
    }

    @Test
    fun `offset preset subtracts minutes from scheduledTime`() {
        val task = baseTask.copy(reminderOffsetMinutes = 15)
        assertEquals(baseTask.scheduledTime!! - 15 * 60_000L, reminderFireTimeOrNull(task, remindersEnabled = true, nowMs = now))
    }

    @Test
    fun `disabled globally yields null even if task opted in`() {
        assertNull(reminderFireTimeOrNull(baseTask, remindersEnabled = false, nowMs = now))
    }

    @Test
    fun `task reminder disabled yields null`() {
        val task = baseTask.copy(reminderEnabled = false)
        assertNull(reminderFireTimeOrNull(task, remindersEnabled = true, nowMs = now))
    }

    @Test
    fun `done task yields null`() {
        val task = baseTask.copy(isDone = 1)
        assertNull(reminderFireTimeOrNull(task, remindersEnabled = true, nowMs = now))
    }

    @Test
    fun `all-day task yields null regardless of offset`() {
        val task = baseTask.copy(isAllDay = true)
        assertNull(reminderFireTimeOrNull(task, remindersEnabled = true, nowMs = now))
    }

    @Test
    fun `prayer-linked task yields null regardless of offset`() {
        val task = baseTask.copy(prayerName = "Dhuhr")
        assertNull(reminderFireTimeOrNull(task, remindersEnabled = true, nowMs = now))
    }

    @Test
    fun `unscheduled task yields null`() {
        val task = baseTask.copy(scheduledTime = null)
        assertNull(reminderFireTimeOrNull(task, remindersEnabled = true, nowMs = now))
    }

    @Test
    fun `fire time already in the past is skipped silently`() {
        val task = baseTask.copy(reminderOffsetMinutes = 1_440) // 1 day before, but task is only 1 hour out
        assertNull(reminderFireTimeOrNull(task, remindersEnabled = true, nowMs = now))
    }
}
