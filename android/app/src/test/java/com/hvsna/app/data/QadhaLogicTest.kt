package com.hvsna.app.data

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import java.time.LocalDate

/*
 * Reference dates (java.time's HijrahChronology = Umm al-Qura):
 *   1 Ramadan 1446 = 2025-03-01, 1 Shawwal 1446 (Eid al-Fitr) = 2025-03-30,
 *   10 Dhu al-Hijjah 1446 (Eid al-Adha) = 2025-06-06, 1 Ramadan 1447 = 2026-02-18.
 */
class QadhaLogicTest {

    private fun owed(year: Int, missed: String? = null, createdAt: Long = 0L, id: String = "id-$year-$missed-$createdAt") =
        QadhaFast(id = id, ramadanHijriYear = year, missedDate = missed, reason = QadhaReason.HAID, createdAt = createdAt)

    @Test
    fun `ramadanDates covers Ramadan 1446 exactly`() {
        val dates = ramadanDates(1446)
        assertEquals(LocalDate.of(2025, 3, 1), dates.first())
        assertEquals(LocalDate.of(2025, 3, 29), dates.last())
        assertEquals(29, dates.size)
    }

    @Test
    fun `ramadanDates honors a month offset`() {
        // -1 on Ramadan (month 9) shifts every Ramadan day one Gregorian day later.
        val dates = ramadanDates(1446, mapOf(9 to -1))
        assertEquals(LocalDate.of(2025, 3, 2), dates.first())
    }

    @Test
    fun `latestRamadanYear switches on 1 Ramadan`() {
        assertEquals(1445, latestRamadanYear(LocalDate.of(2025, 2, 28)))
        assertEquals(1446, latestRamadanYear(LocalDate.of(2025, 3, 1)))
        assertEquals(1446, latestRamadanYear(LocalDate.of(2026, 2, 17)))
        assertEquals(1447, latestRamadanYear(LocalDate.of(2026, 2, 18)))
    }

    @Test
    fun `summary counts owed and made up per year, oldest first, ignoring deleted`() {
        val rows = listOf(
            owed(1446, createdAt = 1),
            owed(1446, createdAt = 2).copy(madeUpOn = "2025-04-10"),
            owed(1445, createdAt = 3),
            owed(1445, createdAt = 4).copy(deletedAt = 99L),
        )
        assertEquals(
            listOf(QadhaYearSummary(1445, owed = 1, madeUp = 0), QadhaYearSummary(1446, owed = 1, madeUp = 1)),
            summarizeQadhaByYear(rows),
        )
    }

    @Test
    fun `oldest owed is picked by year, then missed date, then undated rows`() {
        val undated1445 = owed(1445, createdAt = 5)
        val dated1445 = owed(1445, missed = "2024-03-20", createdAt = 9)
        val rows = listOf(owed(1446, missed = "2025-03-05"), undated1445, dated1445)
        assertEquals(dated1445, oldestOwedFor(rows, LocalDate.of(2025, 4, 10)))
    }

    @Test
    fun `a fast cannot settle debt from a Ramadan that has not ended yet`() {
        val rows = listOf(owed(1446, missed = "2025-03-05"))
        assertNull(oldestOwedFor(rows, LocalDate.of(2025, 3, 20)))
        assertEquals(rows.first(), oldestOwedFor(rows, LocalDate.of(2025, 4, 1)))
    }

    @Test
    fun `made-up date checks`() {
        val today = LocalDate.of(2025, 8, 1)
        val rows = listOf(owed(1446))
        assertEquals(MadeUpDateCheck.OK, checkMadeUpDate(LocalDate.of(2025, 4, 10), today, rows))
        assertEquals(MadeUpDateCheck.FUTURE, checkMadeUpDate(LocalDate.of(2025, 8, 2), today, rows))
        assertEquals(MadeUpDateCheck.FORBIDDEN_EID, checkMadeUpDate(LocalDate.of(2025, 3, 30), today, rows))
        assertEquals(MadeUpDateCheck.FORBIDDEN_EID, checkMadeUpDate(LocalDate.of(2025, 6, 6), today, rows))
        assertEquals(MadeUpDateCheck.WARN_TASHRIQ, checkMadeUpDate(LocalDate.of(2025, 6, 7), today, rows))
        assertEquals(MadeUpDateCheck.FORBIDDEN_RAMADAN, checkMadeUpDate(LocalDate.of(2025, 3, 15), today, rows))
        assertEquals(MadeUpDateCheck.NOTHING_OWED, checkMadeUpDate(LocalDate.of(2025, 4, 10), today, emptyList()))
        val logged = listOf(owed(1446), owed(1446, createdAt = 1).copy(madeUpOn = "2025-04-10"))
        assertEquals(MadeUpDateCheck.ALREADY_LOGGED, checkMadeUpDate(LocalDate.of(2025, 4, 10), today, logged))
    }

    @Test
    fun `delayed debt is flagged only after the next Ramadan starts`() {
        val rows = listOf(owed(1446))
        assertFalse(hasDelayedQadha(rows, LocalDate.of(2026, 2, 17)))
        assertTrue(hasDelayedQadha(rows, LocalDate.of(2026, 2, 18)))
        assertFalse(hasDelayedQadha(rows.map { it.copy(madeUpOn = "2025-05-01") }, LocalDate.of(2026, 3, 1)))
    }

    @Test
    fun `newOwedQadha creates undated rows with distinct ids`() {
        val rows = newOwedQadha(3, 1446, QadhaReason.TRAVEL, now = 42L)
        assertEquals(3, rows.size)
        assertEquals(3, rows.map { it.id }.toSet().size)
        assertTrue(rows.all { it.ramadanHijriYear == 1446 && it.missedDate == null && it.isOwed && it.createdAt == 42L })
    }

    @Test(expected = IllegalArgumentException::class)
    fun `newOwedQadha rejects an unknown reason`() {
        newOwedQadha(1, 1446, "SOMETHING")
    }
}
