package com.hvsna.app.data

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.combine
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

val Context.settingsDataStore: DataStore<Preferences> by preferencesDataStore(name = "settings")

private val settingsJson = Json { ignoreUnknownKeys = true }

/**
 * `location`/`calculationMethod`/`madhab`/`hijriMonthOffsets` live in Room as
 * a key-value table (see [SettingsEntry]) so they can flow through sync —
 * `location` and `hijriMonthOffsets` have web counterparts (shaped to match
 * packages/app/src/modules/settings/settings.ts's `LocationSetting` and
 * `GeneralSettings.hijriMonthOffsets` exactly), `calculationMethod`/`madhab`
 * are Android-only and excluded from push/pull (see the sync module's
 * exclusion set). remindersEnabled stays in DataStore — it's a device-local
 * notification preference, not something that should sync.
 */
                                    class SettingsRepository(
    private val context: Context,
    private val settingsDao: SettingsDao,
    private val onDataChanged: () -> Unit = {},
) {

    private object Keys {
        val REMINDERS_ENABLED = booleanPreferencesKey("reminders_enabled")
    }

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
        )
    }

    suspend fun updateLocation(lat: Double, lng: Double, cityName: String) {
        val now = System.currentTimeMillis()
        val value = LocationSettingValue(source = "manual", resolvedAt = now, lat = lat, lng = lng, name = cityName)
        settingsDao.upsert(SettingsEntry(SettingsKeys.LOCATION, settingsJson.encodeToString(value), now))
        onDataChanged()
    }

    suspend fun updateCalculationMethod(method: String) {
        settingsDao.upsert(SettingsEntry(SettingsKeys.CALCULATION_METHOD, method, System.currentTimeMillis()))
        onDataChanged()
    }

    suspend fun updateMadhab(madhab: String) {
        settingsDao.upsert(SettingsEntry(SettingsKeys.MADHAB, madhab, System.currentTimeMillis()))
        onDataChanged()
    }

    suspend fun updateHijriMonthOffsets(offsets: Map<Int, Int>) {
        val cleaned = offsets.filterValues { it != 0 }.mapKeys { it.key.toString() }
        settingsDao.upsert(
            SettingsEntry(SettingsKeys.HIJRI_MONTH_OFFSETS, settingsJson.encodeToString(cleaned), System.currentTimeMillis()),
        )
        onDataChanged()
    }

    suspend fun updateRemindersEnabled(enabled: Boolean) {
        context.settingsDataStore.edit { prefs ->
            prefs[Keys.REMINDERS_ENABLED] = enabled
        }
    }
}
