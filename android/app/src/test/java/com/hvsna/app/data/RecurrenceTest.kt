package com.hvsna.app.data

import java.time.LocalDate
import org.junit.Assert.assertEquals
import org.junit.Test

class RecurrenceTest {

    @Test
    fun `daily interval steps by intervalCount days`() {
        val anchor = LocalDate.of(2026, 7, 15)
        assertEquals(LocalDate.of(2026, 7, 18), occurrenceDate(anchor, 3, RecurrenceUnit.DAY, 1))
    }

    @Test
    fun `weekly interval steps by intervalCount weeks`() {
        val anchor = LocalDate.of(2026, 7, 15)
        assertEquals(LocalDate.of(2026, 7, 29), occurrenceDate(anchor, 2, RecurrenceUnit.WEEK, 1))
    }

    @Test
    fun `monthly interval on a mid-month date steps cleanly`() {
        val anchor = LocalDate.of(2026, 3, 15)
        assertEquals(LocalDate.of(2026, 4, 15), occurrenceDate(anchor, 1, RecurrenceUnit.MONTH, 1))
    }

    @Test
    fun `month-end anchor clamps per-occurrence without permanent drift`() {
        val anchor = LocalDate.of(2024, 1, 31)
        assertEquals(LocalDate.of(2024, 2, 29), occurrenceDate(anchor, 1, RecurrenceUnit.MONTH, 1))
        assertEquals(LocalDate.of(2024, 3, 31), occurrenceDate(anchor, 1, RecurrenceUnit.MONTH, 2))
        assertEquals(LocalDate.of(2024, 4, 30), occurrenceDate(anchor, 1, RecurrenceUnit.MONTH, 3))
    }
}
