package com.hvsna.app.data

import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.util.Calendar

fun occurrenceDate(anchorDate: LocalDate, intervalCount: Int, unit: RecurrenceUnit, occurrenceIndex: Int): LocalDate =
    when (unit) {
        RecurrenceUnit.DAY -> anchorDate.plusDays(intervalCount.toLong() * occurrenceIndex)
        RecurrenceUnit.WEEK -> anchorDate.plusWeeks(intervalCount.toLong() * occurrenceIndex)
        RecurrenceUnit.MONTH -> anchorDate.plusMonths(intervalCount.toLong() * occurrenceIndex)
    }

fun epochMillisToLocalDate(epochMillis: Long): LocalDate =
    Instant.ofEpochMilli(epochMillis).atZone(ZoneId.systemDefault()).toLocalDate()

fun stampClockTime(date: LocalDate, hour: Int, minute: Int): Long = Calendar.getInstance().apply {
    set(date.year, date.monthValue - 1, date.dayOfMonth, hour, minute, 0)
    set(Calendar.MILLISECOND, 0)
}.timeInMillis

fun stampAllDay(date: LocalDate): Long = Calendar.getInstance().apply {
    set(date.year, date.monthValue - 1, date.dayOfMonth, 23, 59, 59)
    set(Calendar.MILLISECOND, 999)
}.timeInMillis

fun stampMidnight(date: LocalDate): Long = Calendar.getInstance().apply {
    set(date.year, date.monthValue - 1, date.dayOfMonth, 0, 0, 0)
    set(Calendar.MILLISECOND, 0)
}.timeInMillis
