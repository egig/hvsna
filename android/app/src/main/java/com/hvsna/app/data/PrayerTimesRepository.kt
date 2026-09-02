package com.hvsna.app.data

import com.batoulapps.adhan.CalculationMethod
import com.batoulapps.adhan.CalculationParameters
import com.batoulapps.adhan.Coordinates
import com.batoulapps.adhan.Madhab
import com.batoulapps.adhan.PrayerAdjustments
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
        val params = parametersFor(calculationMethodName)
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

    private fun parametersFor(methodName: String): CalculationParameters = when (methodName) {
        // KEMENAG (Kementerian Agama RI) — the official Indonesian method, not built
        // into adhan. Sun 20deg below the horizon for Fajr, 18deg for Isha (Aladhan's
        // "method 20"), plus the Kemenag ihtiyati (safety) margin of +2 minutes on
        // every prayer and -2 minutes on sunrise, which lines the result up with the
        // printed Kemenag / Bimas Islam schedules. Kept identical to the web app's
        // prayer-calculation.ts.
        "KEMENAG" -> CalculationParameters(20.0, 18.0)
            .withMethodAdjustments(PrayerAdjustments(2, -2, 2, 2, 2, 2))

        else -> try {
            CalculationMethod.valueOf(methodName).parameters
        } catch (_: IllegalArgumentException) {
            CalculationMethod.MOON_SIGHTING_COMMITTEE.parameters
        }
    }
}
