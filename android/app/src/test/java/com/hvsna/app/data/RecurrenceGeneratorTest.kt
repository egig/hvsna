package com.hvsna.app.data

import java.time.LocalDate
import org.junit.Assert.assertEquals
import org.junit.Test

class RecurrenceGeneratorTest {
    private val noPrayer: (String, LocalDate) -> Long? = { _, _ -> null }

    private fun ruleFor(anchor: LocalDate, recurringType: String, interval: Int) = RecurrenceRule(
        title = "Test",
        description = "",
        recurringType = recurringType,
        recurringInterval = interval,
        baseDateEpoch = stampMidnight(anchor),
    )

    private fun occurrenceDates(rule: RecurrenceRule, count: Int): List<LocalDate> {
        val horizon = rule.baseDateEpoch + 400L * 366 * 86_400_000L
        return computeOccurrencesInRange(rule, rule.baseDateEpoch, horizon, noPrayer)
            .take(count)
            .map { epochMillisToLocalDate(it) }
    }

    @Test
    fun `daily interval steps by recurringInterval days`() {
        val anchor = LocalDate.of(2026, 7, 15)
        assertEquals(
            listOf(anchor, LocalDate.of(2026, 7, 18)),
            occurrenceDates(ruleFor(anchor, RecurringType.DAILY, 3), 2),
        )
    }

    @Test
    fun `weekly interval steps by 7 times recurringInterval days`() {
        val anchor = LocalDate.of(2026, 7, 15)
        assertEquals(
            listOf(anchor, LocalDate.of(2026, 7, 29)),
            occurrenceDates(ruleFor(anchor, RecurringType.WEEKLY, 2), 2),
        )
    }

    @Test
    fun `monthly interval on a mid-month date steps cleanly`() {
        val anchor = LocalDate.of(2026, 3, 15)
        assertEquals(
            listOf(anchor, LocalDate.of(2026, 4, 15)),
            occurrenceDates(ruleFor(anchor, RecurringType.MONTHLY, 1), 2),
        )
    }

    @Test
    fun `month-end anchor clamps per-occurrence without permanent drift`() {
        val anchor = LocalDate.of(2024, 1, 31)
        assertEquals(
            listOf(
                LocalDate.of(2024, 1, 31),
                LocalDate.of(2024, 2, 29),
                LocalDate.of(2024, 3, 31),
                LocalDate.of(2024, 4, 30),
            ),
            occurrenceDates(ruleFor(anchor, RecurringType.MONTHLY, 1), 4),
        )
    }

    @Test
    fun `yearly interval steps by recurringInterval years`() {
        val anchor = LocalDate.of(2026, 2, 10)
        assertEquals(
            listOf(anchor, LocalDate.of(2027, 2, 10)),
            occurrenceDates(ruleFor(anchor, RecurringType.YEARLY, 1), 2),
        )
    }

    @Test
    fun `recurringEnd after_occurrences caps the total series-wide count`() {
        val anchor = LocalDate.of(2026, 1, 1)
        val rule = ruleFor(anchor, RecurringType.DAILY, 1).copy(
            recurringEnd = RecurringEnd.AFTER_OCCURRENCES,
            recurringEndOccurrences = 3,
        )
        val horizon = rule.baseDateEpoch + 30L * 86_400_000L
        val dates = computeOccurrencesInRange(rule, rule.baseDateEpoch, horizon, noPrayer).map { epochMillisToLocalDate(it) }
        assertEquals(listOf(anchor, anchor.plusDays(1), anchor.plusDays(2)), dates)
    }

    @Test
    fun `recurringEnd on_date clamps generation to the end date`() {
        val anchor = LocalDate.of(2026, 1, 1)
        val endDate = LocalDate.of(2026, 1, 3)
        val rule = ruleFor(anchor, RecurringType.DAILY, 1).copy(
            recurringEnd = RecurringEnd.ON_DATE,
            recurringEndEpoch = stampMidnight(endDate) + 86_399_999L, // end of endDate
        )
        val horizon = rule.baseDateEpoch + 30L * 86_400_000L
        val dates = computeOccurrencesInRange(rule, rule.baseDateEpoch, horizon, noPrayer).map { epochMillisToLocalDate(it) }
        assertEquals(listOf(anchor, anchor.plusDays(1), anchor.plusDays(2)), dates)
    }

    @Test
    fun `isPrayerAnchored treats null blank and clock times as not prayer-anchored`() {
        assertEquals(false, isPrayerAnchored(null))
        assertEquals(false, isPrayerAnchored(""))
        assertEquals(false, isPrayerAnchored("   "))
        assertEquals(false, isPrayerAnchored("09:30"))
        assertEquals(true, isPrayerAnchored("Dhuhr"))
    }

    @Test
    fun `resolveOccurrenceEpoch treats blank atTime as end of day`() {
        val date = LocalDate.of(2026, 1, 1)
        assertEquals(stampEndOfDay(date), resolveOccurrenceEpoch(date, "", noPrayer))
        assertEquals(stampEndOfDay(date), resolveOccurrenceEpoch(date, null, noPrayer))
    }

    @Test
    fun `occurrenceExceptions suppresses a matching virtual occurrence`() {
        val anchor = LocalDate.of(2026, 1, 1)
        val rule = ruleFor(anchor, RecurringType.DAILY, 1).copy(
            occurrenceExceptions = serializeOccurrenceExceptions(setOf(occurrenceDateKey(anchor.plusDays(1)))),
        )
        val horizon = rule.baseDateEpoch + 3L * 86_400_000L
        val dates = occurrencesInRange(rule, rule.baseDateEpoch, horizon, noPrayer).map { epochMillisToLocalDate(it.scheduledTime!!) }
        assertEquals(listOf(anchor, anchor.plusDays(2)), dates)
    }

    @Test
    fun `seriesEditExceptions keeps past keys, drops at-or-after the anchor, always adds the anchor`() {
        val past = "20260101"
        val anchor = "20260110"
        val future = "20260115"
        assertEquals(
            setOf(past, anchor),
            seriesEditExceptions(setOf(past, anchor, future), anchor),
        )
        assertEquals(setOf(anchor), seriesEditExceptions(emptySet(), anchor))
    }

    private fun taskFor(
        title: String = "T",
        description: String = "",
        scheduledTime: Long? = 1_000L,
        atTime: String? = "09:00",
        recurringTaskId: String? = "rule_1",
        reminderEnabled: Boolean = false,
        reminderOffsetMinutes: Int = 0,
    ) = Task(
        title = title, description = description, scheduledTime = scheduledTime, atTime = atTime,
        recurringTaskId = recurringTaskId, reminderEnabled = reminderEnabled, reminderOffsetMinutes = reminderOffsetMinutes,
    )

    private val ruleOn = RecurrenceRule(
        id = "rule_1", title = "T", description = "", recurringType = RecurringType.DAILY,
        recurringInterval = 1, baseDateEpoch = 0L,
    )
    private val recurrenceOn = RecurrenceInput(enabled = true, recurringType = RecurringType.DAILY, recurringInterval = 1)

    @Test
    fun `recurringEditChangedAnything is false for an identical save`() {
        val t = taskFor()
        assertEquals(
            false,
            recurringEditChangedAnything(t, setOf("a"), ruleOn, t.copy(), setOf("a"), recurrenceOn),
        )
    }

    @Test
    fun `recurringEditChangedAnything is true when a tracked field, tag set, or repeat setting differs`() {
        val t = taskFor()
        assertEquals(true, recurringEditChangedAnything(t, setOf("a"), ruleOn, t.copy(title = "T2"), setOf("a"), recurrenceOn))
        assertEquals(true, recurringEditChangedAnything(t, setOf("a"), ruleOn, t.copy(scheduledTime = 2_000L), setOf("a"), recurrenceOn))
        assertEquals(true, recurringEditChangedAnything(t, setOf("a"), ruleOn, t.copy(), setOf("a", "b"), recurrenceOn))
        assertEquals(true, recurringEditChangedAnything(t, setOf("a"), ruleOn, t.copy(), setOf("a"), recurrenceOn.copy(recurringInterval = 2)))
        assertEquals(true, recurringEditChangedAnything(t, setOf("a"), ruleOn, t.copy(), setOf("a"), RecurrenceInput.None))
    }
}
