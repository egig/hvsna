package com.hvsna.app.data

import java.time.LocalDate
import org.junit.Assert.assertEquals
import org.junit.Test

class HijriDateTest {

    @Test
    fun `known date converts to expected Hijri date`() {
        val date = LocalDate.of(2024, 1, 1)
        assertEquals("19 Jumada al-thani 1445", hijriDateLabel(date))
        assertEquals(19, hijriDayOfMonth(date))
    }

    @Test
    fun `positive month offset shifts the Hijri date forward`() {
        val date = LocalDate.of(2024, 1, 1)
        assertEquals("20 Jumada al-thani 1445", hijriDateLabel(date, monthOffsets = mapOf(6 to 1)))
    }

    @Test
    fun `negative month offset shifts the Hijri date backward`() {
        val date = LocalDate.of(2024, 1, 1)
        assertEquals("17 Jumada al-thani 1445", hijriDateLabel(date, monthOffsets = mapOf(6 to -2)))
    }

    @Test
    fun `offset for a different month has no effect`() {
        val date = LocalDate.of(2024, 1, 1)
        assertEquals("19 Jumada al-thani 1445", hijriDateLabel(date, monthOffsets = mapOf(7 to 2)))
    }
}
