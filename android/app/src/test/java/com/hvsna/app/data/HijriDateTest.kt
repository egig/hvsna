package com.hvsna.app.data

import java.time.LocalDate
import org.junit.Assert.assertEquals
import org.junit.Test

class HijriDateTest {

    @Test
    fun `known date converts to expected Hijri date`() {
        val date = LocalDate.of(2024, 1, 1)
        assertEquals("19 Jumada al-thani 1445 AH", hijriDateLabel(date, adjustmentDays = 0))
        assertEquals(19, hijriDayOfMonth(date, adjustmentDays = 0))
    }

    @Test
    fun `positive adjustment shifts the Hijri date forward`() {
        val date = LocalDate.of(2024, 1, 1)
        assertEquals("20 Jumada al-thani 1445 AH", hijriDateLabel(date, adjustmentDays = 1))
    }

    @Test
    fun `negative adjustment shifts the Hijri date backward`() {
        val date = LocalDate.of(2024, 1, 1)
        assertEquals("17 Jumada al-thani 1445 AH", hijriDateLabel(date, adjustmentDays = -2))
    }
}
