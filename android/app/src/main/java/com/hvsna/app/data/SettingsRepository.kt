package com.hvsna.app.data

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.map
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

val Context.settingsDataStore: DataStore<Preferences> by preferencesDataStore(name = "settings")

private val settingsJson = Json { ignoreUnknownKeys = true }

private object Keys {
    val REMINDERS_ENABLED = booleanPreferencesKey("reminders_enabled")
    val THEME_MODE = stringPreferencesKey("theme_mode")
    val LANGUAGE = stringPreferencesKey("language")
}

private fun themeModeFromPrefs(prefs: Preferences): ThemeMode =
    prefs[Keys.THEME_MODE]?.let { runCatching { ThemeMode.valueOf(it) }.getOrNull() } ?: ThemeMode.SYSTEM

private fun languageFromPrefs(prefs: Preferences): AppLanguage =
    prefs[Keys.LANGUAGE]?.let { runCatching { AppLanguage.valueOf(it) }.getOrNull() } ?: AppLanguage.SYSTEM

/**
 * Reads just the theme mode, independent of [SettingsRepository] — used by
 * [com.hvsna.app.MainActivity] to pick the color scheme before the rest of
 * the app's dependency graph (ObjectBox stores, etc.) is constructed.
 */
fun themeModeFlow(context: Context): Flow<ThemeMode> = context.settingsDataStore.data.map(::themeModeFromPrefs)

/**
 * Reads just the UI language, independent of [SettingsRepository] — used by
 * [com.hvsna.app.MainActivity] to provide the translation table above the app,
 * and by [com.hvsna.app.i18n.Translations] for non-Compose call sites.
 */
fun languageFlow(context: Context): Flow<AppLanguage> = context.settingsDataStore.data.map(::languageFromPrefs)

/**
 * `location`/`calculationMethod`/`madhab`/`hijriMonthOffsets` live in ObjectBox as a
 * key-value entity (see [SettingsEntry]); remindersEnabled/themeMode/language stay in DataStore.
 */
class SettingsRepository(
    private val context: Context,
    private val settingsDao: SettingsStore,
) {

    val settings: Flow<AppSettings> = combine(settingsDao.observeAll(), context.settingsDataStore.data) { rows, prefs ->
        val values = rows.associate { it.key to it.value }
        val location = values[SettingsKeys.LOCATION]?.let {
            runCatching { settingsJson.decodeFromString<LocationSettingValue>(it) }.getOrNull()
        }
        val hijriMonthOffsets = values[SettingsKeys.HIJRI_MONTH_OFFSETS]?.let {
            runCatching { settingsJson.decodeFromString<Map<String, Int>>(it).mapKeys { entry -> entry.key.toInt() } }.getOrNull()
        } ?: emptyMap()
        AppSettings(
            lat = location?.lat ?: 0.0,
            lng = location?.lng ?: 0.0,
            cityName = location?.name ?: "",
            calculationMethod = values[SettingsKeys.CALCULATION_METHOD] ?: "MOON_SIGHTING_COMMITTEE",
            madhab = values[SettingsKeys.MADHAB] ?: "SHAFI",
            hijriMonthOffsets = hijriMonthOffsets,
            remindersEnabled = prefs[Keys.REMINDERS_ENABLED] ?: false,
            themeMode = themeModeFromPrefs(prefs),
            language = languageFromPrefs(prefs),
        )
    }

    suspend fun updateLocation(lat: Double, lng: Double, cityName: String) {
        val now = System.currentTimeMillis()
        val value = LocationSettingValue(source = "manual", resolvedAt = now, lat = lat, lng = lng, name = cityName)
        settingsDao.upsert(SettingsEntry(SettingsKeys.LOCATION, settingsJson.encodeToString(value), now))
    }

    suspend fun updateCalculationMethod(method: String) {
        settingsDao.upsert(SettingsEntry(SettingsKeys.CALCULATION_METHOD, method, System.currentTimeMillis()))
    }

    suspend fun updateMadhab(madhab: String) {
        settingsDao.upsert(SettingsEntry(SettingsKeys.MADHAB, madhab, System.currentTimeMillis()))
    }

    suspend fun updateHijriMonthOffsets(offsets: Map<Int, Int>) {
        val cleaned = offsets.filterValues { it != 0 }.mapKeys { it.key.toString() }
        settingsDao.upsert(
            SettingsEntry(SettingsKeys.HIJRI_MONTH_OFFSETS, settingsJson.encodeToString(cleaned), System.currentTimeMillis()),
        )
    }

    suspend fun updateRemindersEnabled(enabled: Boolean) {
        context.settingsDataStore.edit { prefs ->
            prefs[Keys.REMINDERS_ENABLED] = enabled
        }
    }

    suspend fun updateThemeMode(mode: ThemeMode) {
        context.settingsDataStore.edit { prefs ->
            prefs[Keys.THEME_MODE] = mode.name
        }
    }

    suspend fun updateLanguage(language: AppLanguage) {
        context.settingsDataStore.edit { prefs ->
            prefs[Keys.LANGUAGE] = language.name
        }
    }
}
