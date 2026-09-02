package com.hvsna.app.data

import com.batoulapps.adhan.CalculationParameters
import com.batoulapps.adhan.Coordinates
import com.batoulapps.adhan.PrayerTimes
import com.batoulapps.adhan.data.DateComponents
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class PrayerTimesRepositoryTest {

    private val repo = PrayerTimesRepository()

    // Jakarta
    private val lat = -6.2001514
    private val lng = 106.829547

    private fun kemenag() = repo.getPrayerList(2026, 3, 15, lat, lng, "KEMENAG", "SHAFI").toMap()

    @Test
    fun `KEMENAG returns the five prayers in chronological order`() {
        val t = kemenag()
        assertEquals(setOf("Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"), t.keys)
        assertTrue(t.getValue("Fajr") < t.getValue("Dhuhr"))
        assertTrue(t.getValue("Dhuhr") < t.getValue("Asr"))
        assertTrue(t.getValue("Asr") < t.getValue("Maghrib"))
        assertTrue(t.getValue("Maghrib") < t.getValue("Isha"))
    }

    @Test
    fun `KEMENAG applies Fajr 20 Isha 18 plus the two-minute ihtiyati margin`() {
        val raw = PrayerTimes(
            Coordinates(lat, lng),
            DateComponents(2026, 3, 15),
            CalculationParameters(20.0, 18.0),
        )
        val t = kemenag()
        // +2 min on every prayer (adhan rounds seconds, so allow a 1s slop).
        assertOffsetAboutTwoMinutes(raw.fajr.time, t.getValue("Fajr"))
        assertOffsetAboutTwoMinutes(raw.dhuhr.time, t.getValue("Dhuhr"))
        assertOffsetAboutTwoMinutes(raw.asr.time, t.getValue("Asr"))
        assertOffsetAboutTwoMinutes(raw.maghrib.time, t.getValue("Maghrib"))
        assertOffsetAboutTwoMinutes(raw.isha.time, t.getValue("Isha"))
    }

    private fun assertOffsetAboutTwoMinutes(rawMs: Long, adjustedMs: Long) {
        // adhan leaves the sub-second remainder at construction-time millis, so two
        // computations of the "same" instant differ by ~1ms — compare at minute grain.
        assertEquals(2L, adjustedMs / 60_000L - rawMs / 60_000L)
    }

    @Test
    fun `an unrecognized method name falls back to Moon Sighting Committee`() {
        val bogus = repo.getPrayerList(2026, 3, 15, lat, lng, "NOT_A_METHOD", "SHAFI").toMap()
        val fallback = repo.getPrayerList(2026, 3, 15, lat, lng, "MOON_SIGHTING_COMMITTEE", "SHAFI").toMap()
        assertEquals(fallback.keys, bogus.keys)
        for (k in fallback.keys) {
            assertEquals(k, fallback.getValue(k) / 60_000L, bogus.getValue(k) / 60_000L)
        }
    }

    @Test
    fun `no location yields an empty list is caller's concern - invalid coords still compute`() {
        // getPrayerList only returns empty on an exception; documents that 0,0 is a valid
        // coordinate to adhan (callers gate on hasLocation before calling).
        assertEquals(5, repo.getPrayerList(2026, 3, 15, 0.0, 0.0, "KEMENAG", "SHAFI").size)
    }
}
