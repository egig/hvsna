package com.hvsna.app.sync

import com.hvsna.app.data.RecurrenceRule
import com.hvsna.app.data.RecurringEnd
import com.hvsna.app.data.RecurringType
import com.hvsna.app.data.SettingsEntry
import com.hvsna.app.data.Tag
import com.hvsna.app.data.Task
import org.junit.Assert.assertEquals
import org.junit.Test

class WireMappingTest {

    @Test
    fun `task round-trips through its wire row`() {
        val task = Task(
            id = "task-1",
            title = "Buy groceries",
            description = "Milk and eggs",
            scheduledTime = 1_700_000_000_000L,
            isDone = 1,
            atTime = "09:30",
            completedTime = 1_700_000_100_000L,
            recurringTaskId = "rule-1",
            recurringType = RecurringType.DAILY,
            recurringInterval = 2,
            lat = 6.2,
            lng = 106.8,
            timezone = "Asia/Jakarta",
            hijriDateOffset = 1,
            reminderEnabled = true,
            reminderOffsetMinutes = 15,
            createdAt = 1_699_000_000_000L,
            updatedAt = 1_700_000_000_000L,
            deletedAt = null,
            _dirty = 1,
        )
        val wire = task.toWireRow(tagIds = listOf("tag-a", "tag-b"))

        assertEquals(task.id, wire.id)
        assertEquals(task.title, wire.name)
        assertEquals(task.isDone, wire.status)
        assertEquals(task.scheduledTime, wire.at_epoch_millis)
        assertEquals(task.completedTime, wire.completed_at)
        assertEquals(listOf("tag-a", "tag-b"), wire.tag_ids)

        val roundTripped = wire.toTask()
        assertEquals(task.id, roundTripped.id)
        assertEquals(task.title, roundTripped.title)
        assertEquals(task.isDone, roundTripped.isDone)
        assertEquals(task.atTime, roundTripped.atTime)
        assertEquals(task.recurringTaskId, roundTripped.recurringTaskId)
        assertEquals(task.scheduledTime, roundTripped.scheduledTime)
        assertEquals(task.completedTime, roundTripped.completedTime)
        assertEquals(task.createdAt, roundTripped.createdAt)
        assertEquals(task.updatedAt, roundTripped.updatedAt)
        // reminderEnabled/reminderOffsetMinutes have no wire counterpart, so a bare
        // round-trip through the wire type can't preserve them — that's the caller's
        // job (see TaskDao.applyIncomingTask), not this mapping layer's.
    }

    @Test
    fun `recurrence rule round-trips and always reports empty tag_ids`() {
        val rule = RecurrenceRule(
            id = "rule-1",
            title = "Standup",
            description = "",
            recurringType = RecurringType.WEEKLY,
            recurringInterval = 1,
            baseDateEpoch = 1_700_000_000_000L,
            atTime = "fajr",
            recurringEnd = RecurringEnd.AFTER_OCCURRENCES,
            recurringEndOccurrences = 10,
            useGregorian = false,
            occurrenceExceptions = """["20260101"]""",
            createdAt = 1_699_000_000_000L,
            updatedAt = 1_700_000_000_000L,
        )
        val wire = rule.toWireRow()

        assertEquals(rule.id, wire.id)
        assertEquals(rule.title, wire.name)
        assertEquals(rule.recurringType, wire.recurring_type)
        assertEquals(rule.baseDateEpoch, wire.base_date_epoch)
        assertEquals(0, wire.use_gregorian)
        assertEquals(emptyList<String>(), wire.tag_ids)
        assertEquals(rule.occurrenceExceptions, wire.occurrence_exceptions)

        val roundTripped = wire.toRecurrenceRule()
        assertEquals(rule.id, roundTripped.id)
        assertEquals(rule.recurringType, roundTripped.recurringType)
        assertEquals(rule.recurringEnd, roundTripped.recurringEnd)
        assertEquals(rule.recurringEndOccurrences, roundTripped.recurringEndOccurrences)
        assertEquals(rule.useGregorian, roundTripped.useGregorian)
        assertEquals(rule.occurrenceExceptions, roundTripped.occurrenceExceptions)
    }

    @Test
    fun `tag color round-trips as opaque hex, alpha is not preserved`() {
        val tag = Tag(id = "tag-1", name = "Work", color = 0xFF90A4AEL, createdAt = 1L, updatedAt = 2L)
        val wire = tag.toWireRow()

        assertEquals("#90A4AE", wire.color)

        val roundTripped = wire.toTag()
        assertEquals(0xFF90A4AEL, roundTripped.color)
    }

    @Test
    fun `settings entry round-trips`() {
        val entry = SettingsEntry(key = "location", value = """{"lat":1.0}""", updatedAt = 123L)
        val wire = entry.toWireRow()
        assertEquals(entry.key, wire.key)
        assertEquals(entry.value, wire.value)
        assertEquals(entry.updatedAt, wire.updated_at)

        val roundTripped = wire.toSettingsEntry()
        assertEquals(entry.key, roundTripped.key)
        assertEquals(entry.value, roundTripped.value)
        assertEquals(entry.updatedAt, roundTripped.updatedAt)
    }
}
