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
private val hijriMonthNames = listOf(
    "Muharram", "Safar", "Rabi' al-awwal", "Rabi' al-thani",
    "Jumada al-awwal", "Jumada al-thani", "Rajab", "Sha'ban",
    "Ramadan", "Shawwal", "Dhu al-Qi'dah", "Dhu al-Hijjah",
)

private fun adjustedHijrahDate(date: LocalDate, adjustmentDays: Int): HijrahDate =
    HijrahDate.from(date.plusDays(adjustmentDays.toLong()))

fun hijriDayOfMonth(date: LocalDate, adjustmentDays: Int = 0): Int =
    adjustedHijrahDate(date, adjustmentDays).get(ChronoField.DAY_OF_MONTH)

fun hijriDateParts(date: LocalDate, adjustmentDays: Int = 0): HijriDateParts {
    val hijrah = adjustedHijrahDate(date, adjustmentDays)
    return HijriDateParts(
        day = hijrah.get(ChronoField.DAY_OF_MONTH),
        monthName = hijriMonthNames[hijrah.get(ChronoField.MONTH_OF_YEAR) - 1],
        year = hijrah.get(ChronoField.YEAR_OF_ERA),
    )
}

fun hijriDateLabel(date: LocalDate, adjustmentDays: Int = 0): String {
    val parts = hijriDateParts(date, adjustmentDays)
    return "${parts.day} ${parts.monthName} ${parts.year}"
}

// The Islamic calendar day begins at sunset, not midnight — pass today's Maghrib time
// so the label rolls over to the next Hijri day once it's passed, matching the web app.
fun hijriDateLabel(epochMillis: Long, adjustmentDays: Int = 0, maghribEpochMillis: Long? = null): String {
    val sunsetShift = if (maghribEpochMillis != null && epochMillis >= maghribEpochMillis) 1 else 0
    return hijriDateLabel(
        Instant.ofEpochMilli(epochMillis).atZone(ZoneId.systemDefault()).toLocalDate(),
        adjustmentDays + sunsetShift,
    )
}
