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
 * `location`/`calculationMethod`/`madhab`/`hijriAdjustment` live in Room as a
 * key-value table (see [SettingsEntry]) so they can flow through sync — only
 * `location` has a web counterpart though (shaped to match
 * packages/app/src/modules/settings/settings.ts's LocationSetting exactly),
 * the rest are Android-only and excluded from push/pull (see the sync
 * module's settings allowlist). remindersEnabled stays in DataStore — it's a
 * device-local notification preference, not something that should sync.
 */
class SettingsRepository(private val context: Context, private val settingsDao: SettingsDao) {

    private object Keys {
        val REMINDERS_ENABLED = booleanPreferencesKey("reminders_enabled")
    }

    val settings: Flow<AppSettings> = combine(settingsDao.observeAll(), context.settingsDataStore.data) { rows, prefs ->
        val values = rows.associate { it.key to it.value }
        val location = values[SettingsKeys.LOCATION]?.let {
            runCatching { settingsJson.decodeFromString<LocationSettingValue>(it) }.getOrNull()
        }
        AppSettings(
            lat = location?.lat ?: 0.0,
            lng = location?.lng ?: 0.0,
            cityName = location?.name ?: "",
            calculationMethod = values[SettingsKeys.CALCULATION_METHOD] ?: "MOON_SIGHTING_COMMITTEE",
            madhab = values[SettingsKeys.MADHAB] ?: "SHAFI",
            hijriAdjustment = values[SettingsKeys.HIJRI_ADJUSTMENT]?.toIntOrNull() ?: 0,
            remindersEnabled = prefs[Keys.REMINDERS_ENABLED] ?: false,
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

    suspend fun updateHijriAdjustment(days: Int) {
        val clamped = days.coerceIn(-2, 2)
        settingsDao.upsert(SettingsEntry(SettingsKeys.HIJRI_ADJUSTMENT, clamped.toString(), System.currentTimeMillis()))
    }

    suspend fun updateRemindersEnabled(enabled: Boolean) {
        context.settingsDataStore.edit { prefs ->
            prefs[Keys.REMINDERS_ENABLED] = enabled
        }
    }
}
