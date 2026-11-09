package com.hvsna.app.data

import java.time.LocalDate

/*
 * Pure rules for the qadha (make-up fast) tracker — no Android or ObjectBox types, so they are
 * unit-testable on the JVM. The app records; it does not issue rulings. Only points all four
 * Sunni schools agree on are enforced (no fasting on the two Eids, no making up Ramadan inside
 * Ramadan); the Tashriq days are a warning only, and fidyah is an informational note.
 */

data class QadhaYearSummary(val ramadanHijriYear: Int, val owed: Int, val madeUp: Int) {
    val total: Int get() = owed + madeUp
}

/** Per-Ramadan-year totals of live rows, oldest year first. */
fun summarizeQadhaByYear(rows: List<QadhaFast>): List<QadhaYearSummary> =
    rows.filter { it.isLive }
        .groupBy { it.ramadanHijriYear }
        .map { (year, group) ->
            QadhaYearSummary(
                ramadanHijriYear = year,
                owed = group.count { it.madeUpOn == null },
                madeUp = group.count { it.madeUpOn != null },
            )
        }
        .sortedBy { it.ramadanHijriYear }

/**
 * The Hijri year of the most recent Ramadan that has started on [today]: the current Hijri year
 * from 1 Ramadan onward, the previous one before it.
 */
fun latestRamadanYear(today: LocalDate, monthOffsets: Map<Int, Int> = emptyMap()): Int {
    val ymd = hijriYmd(today, monthOffsets)
    return if (ymd.month >= 9) ymd.year else ymd.year - 1
}

/**
 * True once a later Ramadan has begun while a fast from an earlier one is still owed — the case
 * where the schools differ on fidyah. The UI shows a neutral note, nothing more.
 */
fun hasDelayedQadha(rows: List<QadhaFast>, today: LocalDate, monthOffsets: Map<Int, Int> = emptyMap()): Boolean {
    val latest = latestRamadanYear(today, monthOffsets)
    return rows.any { it.isOwed && it.ramadanHijriYear < latest }
}

/** True when [date] falls after Ramadan of [ramadanHijriYear] has ended. */
fun isAfterRamadan(date: LocalDate, ramadanHijriYear: Int, monthOffsets: Map<Int, Int> = emptyMap()): Boolean {
    val ymd = hijriYmd(date, monthOffsets)
    return ymd.year > ramadanHijriYear || (ymd.year == ramadanHijriYear && ymd.month > 9)
}

/**
 * The owed row a fast made up on [madeUpOn] should settle: the oldest one whose Ramadan had
 * already ended by then. Order is oldest Ramadan year, then dated rows by missed date, then
 * undated (count-entered) rows, then creation time. Order has no fiqh significance; filling the
 * oldest year first simply keeps the oldest debt shrinking first.
 */
fun oldestOwedFor(rows: List<QadhaFast>, madeUpOn: LocalDate, monthOffsets: Map<Int, Int> = emptyMap()): QadhaFast? =
    rows.filter { it.isOwed && isAfterRamadan(madeUpOn, it.ramadanHijriYear, monthOffsets) }
        .minWithOrNull(
            compareBy<QadhaFast> { it.ramadanHijriYear }
                .thenBy(nullsLast()) { it.missedDate }
                .thenBy { it.createdAt },
        )

enum class MadeUpDateCheck {
    OK,
    /** 11–13 Dhu al-Hijjah. Most scholars disallow fasting then; ask the user to confirm. */
    WARN_TASHRIQ,
    /** 1 Shawwal or 10 Dhu al-Hijjah — fasting is prohibited by consensus. */
    FORBIDDEN_EID,
    /** Inside Ramadan — that day's own fast is the obligation; qadha cannot be made up then. */
    FORBIDDEN_RAMADAN,
    FUTURE,
    /** A made-up fast is already logged for this date. */
    ALREADY_LOGGED,
    /** No owed fast from a Ramadan that had ended by this date. */
    NOTHING_OWED,
}

fun checkMadeUpDate(
    date: LocalDate,
    today: LocalDate,
    rows: List<QadhaFast>,
    monthOffsets: Map<Int, Int> = emptyMap(),
): MadeUpDateCheck {
    if (date.isAfter(today)) return MadeUpDateCheck.FUTURE
    val ymd = hijriYmd(date, monthOffsets)
    if ((ymd.month == 10 && ymd.day == 1) || (ymd.month == 12 && ymd.day == 10)) return MadeUpDateCheck.FORBIDDEN_EID
    if (ymd.month == 9) return MadeUpDateCheck.FORBIDDEN_RAMADAN
    val iso = date.toString()
    if (rows.any { it.isLive && it.madeUpOn == iso }) return MadeUpDateCheck.ALREADY_LOGGED
    if (oldestOwedFor(rows, date, monthOffsets) == null) return MadeUpDateCheck.NOTHING_OWED
    if (ymd.month == 12 && ymd.day in 11..13) return MadeUpDateCheck.WARN_TASHRIQ
    return MadeUpDateCheck.OK
}

/** [count] new owed rows for Ramadan [ramadanHijriYear], without specific missed dates. */
fun newOwedQadha(count: Int, ramadanHijriYear: Int, reason: String, now: Long = System.currentTimeMillis()): List<QadhaFast> {
    require(count > 0) { "count must be positive" }
    require(reason in QadhaReason.all) { "unknown reason $reason" }
    return List(count) { QadhaFast(ramadanHijriYear = ramadanHijriYear, reason = reason, createdAt = now, updatedAt = now) }
}
