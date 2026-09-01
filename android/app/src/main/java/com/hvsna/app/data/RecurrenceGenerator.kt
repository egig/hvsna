package com.hvsna.app.data

import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.builtins.serializer
import kotlinx.serialization.json.Json
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.util.Calendar

/**
 * A read-model wrapper distinguishing a persisted [Task] row from a
 * lazily-computed, never-persisted occurrence of a [RecurrenceRule] —
 * mirrors packages/app's `isVirtual: true` convention (recurring-task-
 * generator.ts) so both platforms compute identical occurrences from the
 * same template instead of materializing rows ahead of time.
 */
data class TaskOccurrence(val task: Task, val isVirtual: Boolean)

private const val MAX_ITERATIONS = 400
private const val OVERDUE_LOOKBACK_DAYS = 60L

fun epochMillisToLocalDate(epochMillis: Long): LocalDate =
    Instant.ofEpochMilli(epochMillis).atZone(ZoneId.systemDefault()).toLocalDate()

fun stampMidnight(date: LocalDate): Long = Calendar.getInstance().apply {
    set(date.year, date.monthValue - 1, date.dayOfMonth, 0, 0, 0)
    set(Calendar.MILLISECOND, 0)
}.timeInMillis

fun stampClockTime(date: LocalDate, hour: Int, minute: Int): Long = Calendar.getInstance().apply {
    set(date.year, date.monthValue - 1, date.dayOfMonth, hour, minute, 0)
    set(Calendar.MILLISECOND, 0)
}.timeInMillis

fun stampEndOfDay(date: LocalDate): Long = Calendar.getInstance().apply {
    set(date.year, date.monthValue - 1, date.dayOfMonth, 23, 59, 59)
    set(Calendar.MILLISECOND, 999)
}.timeInMillis

/**
 * True if `atTime` names a prayer rather than a literal "HH:mm" time — matches packages/app's
 * isPrayerBased, except blank strings count as "no time" (web relies on a `if (!task.atTime)`
 * check running first to catch those; Android has no such ordering, so guard here). A synced
 * `at_time = ""` would otherwise render an empty prayer-section header on the Today screen.
 */
fun isPrayerAnchored(atTime: String?): Boolean = !atTime.isNullOrBlank() && !atTime.contains(":")

fun occurrenceDateKey(date: LocalDate): String = "%04d%02d%02d".format(date.year, date.monthValue, date.dayOfMonth)

private val stringListSerializer = ListSerializer(String.serializer())

fun parseOccurrenceExceptions(json: String?): Set<String> {
    if (json == null) return emptySet()
    return Json.decodeFromString(stringListSerializer, json).toSet()
}

fun serializeOccurrenceExceptions(dates: Set<String>): String = Json.encodeToString(stringListSerializer, dates.toList())

/**
 * Resolves the concrete epoch millis for `atTime` on `date`. A prayer name
 * resolves to the *end* of that prayer's window (not its start) via
 * [resolvePrayerEndTime] — matching packages/app's getPrayerEndTime exactly,
 * since that's what "task due at Dhuhr" means there: due sometime before Asr.
 * `atTime == null` means all-day, stamped at end of day.
 */
fun resolveOccurrenceEpoch(date: LocalDate, atTime: String?, resolvePrayerEndTime: (String, LocalDate) -> Long?): Long {
    if (atTime.isNullOrBlank()) return stampEndOfDay(date)
    if (!atTime.contains(":")) {
        return resolvePrayerEndTime(atTime, date) ?: stampEndOfDay(date)
    }
    val parts = atTime.split(":")
    val hour = parts.getOrNull(0)?.toIntOrNull() ?: 0
    val minute = parts.getOrNull(1)?.toIntOrNull() ?: 0
    return stampClockTime(date, hour, minute)
}

/**
 * The [index]th occurrence's date, computed from the original [anchor] every
 * time (never chained off the previous occurrence) — chaining would let a
 * month/year-end clamp permanently drift the series (Jan 31 -> Feb 29 ->
 * Mar 29, losing the 31 for good instead of Mar 31).
 */
private fun occurrenceDateAt(anchor: LocalDate, recurringType: String, interval: Int, index: Int): LocalDate? {
    val n = maxOf(1, interval).toLong() * index
    return when (recurringType) {
        RecurringType.DAILY -> anchor.plusDays(n)
        RecurringType.WEEKLY -> anchor.plusDays(n * 7)
        RecurringType.MONTHLY -> anchor.plusMonths(n)
        RecurringType.YEARLY -> anchor.plusYears(n)
        else -> null // "none" — a one-off task's template metadata, never expands.
    }
}

/**
 * All occurrence epochs for [rule] in `[startEpoch, endEpoch]`, computed
 * on the fly — no ahead-of-time materialization. Mirrors
 * computeOccurrencesInRange in packages/app/src/modules/task/
 * recurring-task-generator.ts, including its 400-iteration safety cap and
 * the three recurringEnd variants.
 */
fun computeOccurrencesInRange(
    rule: RecurrenceRule,
    startEpoch: Long,
    endEpoch: Long,
    resolvePrayerEndTime: (String, LocalDate) -> Long?,
): List<Long> {
    val effectiveEnd = if (rule.recurringEnd == RecurringEnd.ON_DATE && rule.recurringEndEpoch != null) {
        minOf(endEpoch, rule.recurringEndEpoch)
    } else {
        endEpoch
    }
    if (rule.baseDateEpoch > effectiveEnd) return emptyList()

    val maxOccurrences = if (rule.recurringEnd == RecurringEnd.AFTER_OCCURRENCES) {
        rule.recurringEndOccurrences ?: Int.MAX_VALUE
    } else {
        Int.MAX_VALUE
    }

    val anchor = epochMillisToLocalDate(rule.baseDateEpoch)
    val results = mutableListOf<Long>()
    var totalCount = 0
    var index = 0

    while (index < MAX_ITERATIONS && totalCount < maxOccurrences) {
        val date = occurrenceDateAt(anchor, rule.recurringType, rule.recurringInterval, index) ?: break
        val epoch = resolveOccurrenceEpoch(date, rule.atTime, resolvePrayerEndTime)
        if (epoch > effectiveEnd) break
        totalCount++
        if (epoch >= startEpoch) results.add(epoch)
        index++
    }
    return results
}

private fun toVirtualTask(rule: RecurrenceRule, epoch: Long): Task = Task(
    id = "vtask_${rule.id}_$epoch",
    title = rule.title,
    description = rule.description,
    scheduledTime = epoch,
    atTime = rule.atTime,
    recurringTaskId = rule.id,
    recurringType = rule.recurringType,
    recurringInterval = rule.recurringInterval,
    lat = rule.lat,
    lng = rule.lng,
    timezone = rule.timezone,
    hijriDateOffset = rule.hijriDateOffset,
    reminderEnabled = rule.reminderEnabled,
    reminderOffsetMinutes = rule.reminderOffsetMinutes,
)

/**
 * Virtual (never-persisted) occurrences for [rule] in `[startEpoch, endEpoch]`,
 * excluding dates already materialized as real rows (recorded in
 * [RecurrenceRule.occurrenceExceptions]) — the plain in-range half of
 * packages/app's buildVirtualTasksForRange. Android surfaces the "overdue"
 * half (see [overdueOccurrence]) only on its dedicated Overdue screen rather
 * than folding it into every range query, to avoid the same occurrence
 * appearing in two screens at once.
 */
fun occurrencesInRange(
    rule: RecurrenceRule,
    startEpoch: Long,
    endEpoch: Long,
    resolvePrayerEndTime: (String, LocalDate) -> Long?,
): List<Task> {
    val exceptions = parseOccurrenceExceptions(rule.occurrenceExceptions)
    return computeOccurrencesInRange(rule, startEpoch, endEpoch, resolvePrayerEndTime)
        .filter { occurrenceDateKey(epochMillisToLocalDate(it)) !in exceptions }
        .sorted()
        .map { toVirtualTask(rule, it) }
}

/** The single latest occurrence strictly before [beforeEpoch], looking back at most [OVERDUE_LOOKBACK_DAYS]. */
fun overdueOccurrence(
    rule: RecurrenceRule,
    beforeEpoch: Long,
    resolvePrayerEndTime: (String, LocalDate) -> Long?,
): Task? {
    val exceptions = parseOccurrenceExceptions(rule.occurrenceExceptions)
    val lookbackStart = beforeEpoch - OVERDUE_LOOKBACK_DAYS * 86_400_000L
    val epoch = computeOccurrencesInRange(rule, lookbackStart, beforeEpoch - 1, resolvePrayerEndTime)
        .filter { occurrenceDateKey(epochMillisToLocalDate(it)) !in exceptions }
        .maxOrNull() ?: return null
    return toVirtualTask(rule, epoch)
}

/** The next upcoming occurrence for [rule] at or after [fromEpoch], if any, within [horizonEpoch]. */
fun nextOccurrence(
    rule: RecurrenceRule,
    fromEpoch: Long,
    horizonEpoch: Long,
    resolvePrayerEndTime: (String, LocalDate) -> Long?,
): Task? {
    val exceptions = parseOccurrenceExceptions(rule.occurrenceExceptions)
    val epoch = computeOccurrencesInRange(rule, fromEpoch, horizonEpoch, resolvePrayerEndTime)
        .filter { occurrenceDateKey(epochMillisToLocalDate(it)) !in exceptions }
        .minOrNull() ?: return null
    return toVirtualTask(rule, epoch)
}

/**
 * Appends `epoch`'s date to `rule`'s occurrenceExceptions (deduped) so the
 * generator stops re-emitting a virtual for a date that's now a real row,
 * pruning entries older than [OVERDUE_LOOKBACK_DAYS] to match the
 * generator's own lookback window — mirrors addOccurrenceException in
 * packages/app/src/modules/task/recurring-task-utils.ts.
 */
fun addOccurrenceException(rule: RecurrenceRule, epoch: Long, now: Long = System.currentTimeMillis()): RecurrenceRule {
    val cutoff = occurrenceDateKey(epochMillisToLocalDate(now - OVERDUE_LOOKBACK_DAYS * 86_400_000L))
    val updated = (parseOccurrenceExceptions(rule.occurrenceExceptions) + occurrenceDateKey(epochMillisToLocalDate(epoch)))
        .filter { it >= cutoff }
        .toSet()
    return rule.copy(occurrenceExceptions = serializeOccurrenceExceptions(updated))
}
