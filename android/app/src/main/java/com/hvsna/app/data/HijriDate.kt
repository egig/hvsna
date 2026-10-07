package com.hvsna.app.data

import com.hvsna.app.i18n.Strings
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.time.chrono.HijrahDate
import java.time.format.DateTimeFormatter
import java.time.temporal.ChronoField
import java.util.Locale

data class HijriDateParts(val day: Int, val monthName: String, val year: Int)

// Fixed English transliteration, indexed by ChronoField.MONTH_OF_YEAR (1-12).
// Desugared java.time on Android doesn't reliably carry CLDR month-name text
// for non-ISO chronologies (HijrahChronology), so a locale-aware
// DateTimeFormatter silently falls back to numeric months on-device. Also the
// fallback layer for [hijriMonthName] when no [Strings] table is available
// (unit tests, non-Compose call sites).
val hijriMonthNames = listOf(
    "Muharram", "Safar", "Rabi' al-awwal", "Rabi' al-thani",
    "Jumada al-awwal", "Jumada al-thani", "Rajab", "Sha'ban",
    "Ramadan", "Shawwal", "Dhu al-Qi'dah", "Dhu al-Hijjah",
)

/**
 * [monthNumber] is 1-indexed (matches [ChronoField.MONTH_OF_YEAR]). Looks up the
 * `hijriMonth.<n>` translation key when [strings] is provided (the standard Indonesian
 * transliteration differs from the English one — "Rabiul Awal" vs "Rabi' al-awwal"),
 * falling back to the fixed English name in [hijriMonthNames] otherwise.
 */
fun hijriMonthName(monthNumber: Int, strings: Strings? = null): String =
    strings?.get("hijriMonth.$monthNumber") ?: hijriMonthNames[monthNumber - 1]

// Short English transliterations used only by [combinedDateLabel]'s paired Gregorian/Hijri format
// (e.g. "15 Sep / 24 Rabi II") — matches the web app's HIJRI_MONTH_NAMES_EN_SHORT exactly.
// Indonesian has no natural short form, so the combined format always uses the full translated
// hijriMonth.<n> name for that language instead (see [hijriMonthLabelForCombined]).
val hijriMonthNamesShortEn = listOf(
    "Muharram", "Safar", "Rabi I", "Rabi II", "Jumada I", "Jumada II",
    "Rajab", "Shaban", "Ramadan", "Shawwal", "Dhu al-Qidah", "Dhu al-Hijjah",
)

private fun hijriMonthLabelForCombined(monthNumber: Int, strings: Strings?): String =
    if (strings?.locale?.language == "en") hijriMonthNamesShortEn[monthNumber - 1] else hijriMonthName(monthNumber, strings)

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

fun hijriDateParts(date: LocalDate, monthOffsets: Map<Int, Int> = emptyMap(), strings: Strings? = null): HijriDateParts {
    val hijrah = adjustedHijrahDate(date, monthOffsets)
    return HijriDateParts(
        day = hijrah.get(ChronoField.DAY_OF_MONTH),
        monthName = hijriMonthName(hijrah.get(ChronoField.MONTH_OF_YEAR), strings),
        year = hijrah.get(ChronoField.YEAR_OF_ERA),
    )
}

fun hijriDateLabel(date: LocalDate, monthOffsets: Map<Int, Int> = emptyMap(), strings: Strings? = null): String {
    val parts = hijriDateParts(date, monthOffsets, strings)
    return "${parts.day} ${parts.monthName} ${parts.year}"
}

// The Islamic calendar day begins at sunset, not midnight — pass today's Maghrib time
// so the label rolls over to the next Hijri day once it's passed, matching the web app.
fun hijriDateLabel(
    epochMillis: Long,
    monthOffsets: Map<Int, Int> = emptyMap(),
    maghribEpochMillis: Long? = null,
    strings: Strings? = null,
): String {
    val sunsetShift = if (maghribEpochMillis != null && epochMillis >= maghribEpochMillis) 1L else 0L
    val date = Instant.ofEpochMilli(epochMillis).atZone(ZoneId.systemDefault()).toLocalDate().plusDays(sunsetShift)
    return hijriDateLabel(date, monthOffsets, strings)
}

/**
 * Paired Gregorian/Hijri label used on task rows, and the due-date picker's
 * selected-date field, e.g. "15 Sep / 24 Rabi II" (English) or "15 Sep / 24 Rabiul Akhir"
 * (Indonesian). The Gregorian side always uses a 3-letter month abbreviation ("Sep") for this
 * format specifically (never the 4-letter/full name some surfaces otherwise use);
 * [includeYear] appends the year to both sides when the surface's existing year policy calls
 * for one.
 */
fun combinedDateLabel(
    date: LocalDate,
    monthOffsets: Map<Int, Int> = emptyMap(),
    strings: Strings? = null,
    includeYear: Boolean = false,
): String {
    val pattern = if (includeYear) "d MMM yyyy" else "d MMM"
    val gregorian = date.format(DateTimeFormatter.ofPattern(pattern, strings?.locale ?: Locale.ENGLISH))
    val hijrah = adjustedHijrahDate(date, monthOffsets)
    val hijriMonth = hijriMonthLabelForCombined(hijrah.get(ChronoField.MONTH_OF_YEAR), strings)
    val hijriDay = hijrah.get(ChronoField.DAY_OF_MONTH)
    val hijri = if (includeYear) {
        "$hijriDay $hijriMonth ${hijrah.get(ChronoField.YEAR_OF_ERA)}"
    } else {
        "$hijriDay $hijriMonth"
    }
    return "$gregorian / $hijri"
}

// Mirrors [hijriDateLabel]'s epoch-millis overload's sunset-rollover logic exactly — the Islamic
// calendar day begins at sunset, not midnight.
fun combinedDateLabel(
    epochMillis: Long,
    monthOffsets: Map<Int, Int> = emptyMap(),
    maghribEpochMillis: Long? = null,
    strings: Strings? = null,
    includeYear: Boolean = false,
): String {
    val sunsetShift = if (maghribEpochMillis != null && epochMillis >= maghribEpochMillis) 1L else 0L
    val date = Instant.ofEpochMilli(epochMillis).atZone(ZoneId.systemDefault()).toLocalDate().plusDays(sunsetShift)
    return combinedDateLabel(date, monthOffsets, strings, includeYear)
}
