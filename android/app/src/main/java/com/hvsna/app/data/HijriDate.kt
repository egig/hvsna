package com.hvsna.app.data

import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.time.chrono.HijrahDate
import java.time.temporal.ChronoField
import java.util.Locale

data class HijriDateParts(val day: Int, val monthName: String, val year: Int)

// Fixed English transliteration, indexed by ChronoField.MONTH_OF_YEAR (1-12).
// Desugared java.time on Android doesn't reliably carry CLDR month-name text
// for non-ISO chronologies (HijrahChronology), so a locale-aware
// DateTimeFormatter silently falls back to numeric months on-device.
val hijriMonthNames = listOf(
    "Muharram", "Safar", "Rabi' al-awwal", "Rabi' al-thani",
    "Jumada al-awwal", "Jumada al-thani", "Rajab", "Sha'ban",
    "Ramadan", "Shawwal", "Dhu al-Qi'dah", "Dhu al-Hijjah",
)

// Resolves which per-month offset applies by computing the *raw* (un-offset)
// Hijri month for this date first, then looking that month up in the map —
// mirrors packages/app/src/modules/calendar/hijri/core.ts's resolution order
// (raw month determines which offset to apply, not the offset month itself).
private fun resolveOffset(date: LocalDate, monthOffsets: Map<Int, Int>): Int {
    val rawMonth = HijrahDate.from(date).get(ChronoField.MONTH_OF_YEAR)
    return monthOffsets[rawMonth] ?: 0
}

private fun adjustedHijrahDate(date: LocalDate, monthOffsets: Map<Int, Int>): HijrahDate {
    val offset = resolveOffset(date, monthOffsets)
    return HijrahDate.from(date.plusDays(offset.toLong()))
}

fun hijriDayOfMonth(date: LocalDate, monthOffsets: Map<Int, Int> = emptyMap()): Int =
    adjustedHijrahDate(date, monthOffsets).get(ChronoField.DAY_OF_MONTH)

fun hijriDateParts(date: LocalDate, monthOffsets: Map<Int, Int> = emptyMap()): HijriDateParts {
    val hijrah = adjustedHijrahDate(date, monthOffsets)
    return HijriDateParts(
        day = hijrah.get(ChronoField.DAY_OF_MONTH),
        monthName = hijriMonthNames[hijrah.get(ChronoField.MONTH_OF_YEAR) - 1],
        year = hijrah.get(ChronoField.YEAR_OF_ERA),
    )
}

fun hijriDateLabel(date: LocalDate, monthOffsets: Map<Int, Int> = emptyMap()): String {
    val parts = hijriDateParts(date, monthOffsets)
    return "${parts.day} ${parts.monthName} ${parts.year}"
}

// The Islamic calendar day begins at sunset, not midnight — pass today's Maghrib time
// so the label rolls over to the next Hijri day once it's passed, matching the web app.
fun hijriDateLabel(epochMillis: Long, monthOffsets: Map<Int, Int> = emptyMap(), maghribEpochMillis: Long? = null): String {
    val sunsetShift = if (maghribEpochMillis != null && epochMillis >= maghribEpochMillis) 1L else 0L
    val date = Instant.ofEpochMilli(epochMillis).atZone(ZoneId.systemDefault()).toLocalDate().plusDays(sunsetShift)
    return hijriDateLabel(date, monthOffsets)
}
