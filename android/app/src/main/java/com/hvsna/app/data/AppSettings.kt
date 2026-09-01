package com.hvsna.app.data

enum class ThemeMode { LIGHT, DARK, SYSTEM }

/**
 * In-app UI language. [SYSTEM] follows the device locale (Indonesian device →
 * Indonesian, everything else → English). Concrete choices are resolved to a
 * translation file by [com.hvsna.app.i18n.resolveLanguageCode].
 */
enum class AppLanguage { SYSTEM, ENGLISH, INDONESIAN }

data class AppSettings(
    val lat: Double = 0.0,
    val lng: Double = 0.0,
    val cityName: String = "",
    val calculationMethod: String = "MOON_SIGHTING_COMMITTEE",
    val madhab: String = "SHAFI",
    val hijriMonthOffsets: Map<Int, Int> = emptyMap(),
    val remindersEnabled: Boolean = false,
    val themeMode: ThemeMode = ThemeMode.SYSTEM,
    val language: AppLanguage = AppLanguage.SYSTEM,
) {
    val hasLocation: Boolean get() = lat != 0.0 || lng != 0.0
}
