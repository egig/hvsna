package com.hvsna.app.data

data class AppSettings(
    val lat: Double = 0.0,
    val lng: Double = 0.0,
    val cityName: String = "",
    val calculationMethod: String = "MOON_SIGHTING_COMMITTEE",
    val madhab: String = "SHAFI",
    val hijriAdjustment: Int = 0,
    val remindersEnabled: Boolean = false,
) {
    val hasLocation: Boolean get() = lat != 0.0 || lng != 0.0
}
