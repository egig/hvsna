package com.hvsna.app.data

import java.util.Calendar

val prayerOrder = listOf("Fajr", "Dhuhr", "Asr", "Maghrib", "Isha")

fun nextPrayerTime(
    prayerName: String,
    prayerTimes: List<Pair<String, Long>>,
    refEpochMs: Long,
): Long {
    val idx = prayerOrder.indexOf(prayerName)
    if (idx == -1 || idx == prayerOrder.lastIndex) {
        // Isha → midnight (start of next day)
        return Calendar.getInstance().apply {
            timeInMillis = refEpochMs
            add(Calendar.DAY_OF_MONTH, 1)
            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }.timeInMillis - 1
    }
    val nextName = prayerOrder[idx + 1]
    return prayerTimes.firstOrNull { it.first == nextName }?.second ?: refEpochMs
}
