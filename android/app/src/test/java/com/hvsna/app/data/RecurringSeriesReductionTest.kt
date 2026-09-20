package com.hvsna.app.data

import org.junit.Assert.assertEquals
import org.junit.Test

/**
 * Pins collapseToLeadOccurrencePerSeries' exact semantics — see its doc
 * comment — so a regression here would silently show every pending
 * occurrence of a recurring series instead of just the next one.
 */
class RecurringSeriesReductionTest {

    private fun task(id: String, scheduledTime: Long?, recurringTaskId: String? = null) = Task(
        id = id,
        title = "t-$id",
        description = "",
        scheduledTime = scheduledTime,
        recurringTaskId = recurringTaskId,
    )

    @Test
    fun `non-recurring tasks always pass through`() {
        val singleton1 = task("a", 100L)
        val singleton2 = task("b", null)
        val result = collapseToLeadOccurrencePerSeries(listOf(singleton1, singleton2))
        assertEquals(setOf("a", "b"), result.map { it.id }.toSet())
    }

    @Test
    fun `only the earliest-scheduled occurrence of a series survives`() {
        val overdue = task("overdue", 100L, recurringTaskId = "series-1")
        val next = task("next", 200L, recurringTaskId = "series-1")
        val later = task("later", 300L, recurringTaskId = "series-1")
        val result = collapseToLeadOccurrencePerSeries(listOf(later, next, overdue))
        assertEquals(listOf("overdue"), result.map { it.id })
    }

    @Test
    fun `unscheduled occurrence of a series sorts before scheduled ones`() {
        // Mirrors SQLite's default ASC ordering, which treats NULL as smallest.
        val unscheduled = task("unscheduled", null, recurringTaskId = "series-1")
        val scheduled = task("scheduled", 100L, recurringTaskId = "series-1")
        val result = collapseToLeadOccurrencePerSeries(listOf(scheduled, unscheduled))
        assertEquals(listOf("unscheduled"), result.map { it.id })
    }

    @Test
    fun `ties on scheduledTime break on id ascending`() {
        val b = task("b", 100L, recurringTaskId = "series-1")
        val a = task("a", 100L, recurringTaskId = "series-1")
        val result = collapseToLeadOccurrencePerSeries(listOf(b, a))
        assertEquals(listOf("a"), result.map { it.id })
    }

    @Test
    fun `independent series are each collapsed separately`() {
        val series1Lead = task("s1-lead", 100L, recurringTaskId = "series-1")
        val series1Other = task("s1-other", 200L, recurringTaskId = "series-1")
        val series2Lead = task("s2-lead", 50L, recurringTaskId = "series-2")
        val series2Other = task("s2-other", 150L, recurringTaskId = "series-2")
        val singleton = task("singleton", 10L)

        val result = collapseToLeadOccurrencePerSeries(listOf(series1Other, series1Lead, series2Other, series2Lead, singleton))

        assertEquals(setOf("s1-lead", "s2-lead", "singleton"), result.map { it.id }.toSet())
    }
}
