package com.hvsna.app.data

import com.batoulapps.adhan.CalculationMethod
import com.batoulapps.adhan.Coordinates
import com.batoulapps.adhan.Madhab
import com.batoulapps.adhan.PrayerTimes
import com.batoulapps.adhan.data.DateComponents

class PrayerTimesRepository {

    fun getPrayerList(
        year: Int,
        month: Int,
        day: Int,
        lat: Double,
        lng: Double,
        calculationMethodName: String,
        madhabName: String,
    ): List<Pair<String, Long>> = runCatching {
        val coordinates = Coordinates(lat, lng)
        val dateComponents = DateComponents(year, month, day)
        val method = try {
            CalculationMethod.valueOf(calculationMethodName)
        } catch (_: IllegalArgumentException) {
            CalculationMethod.MOON_SIGHTING_COMMITTEE
        }
        val params = method.parameters
        params.madhab = try {
            Madhab.valueOf(madhabName)
        } catch (_: IllegalArgumentException) {
            Madhab.SHAFI
        }
        val prayerTimes = PrayerTimes(coordinates, dateComponents, params)
        listOf(
            "Fajr" to prayerTimes.fajr.time,
            "Dhuhr" to prayerTimes.dhuhr.time,
            "Asr" to prayerTimes.asr.time,
            "Maghrib" to prayerTimes.maghrib.time,
            "Isha" to prayerTimes.isha.time,
        )
    }.getOrElse { emptyList() }
}
