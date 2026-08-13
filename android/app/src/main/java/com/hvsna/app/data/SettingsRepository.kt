package com.hvsna.app.data

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.combine

val Context.settingsDataStore: DataStore<Preferences> by preferencesDataStore(name = "settings")

/**
 * lat/lng/cityName/calculationMethod/madhab/hijriAdjustment live in Room as a
 * key-value table (see [SettingsEntry]) so they can flow through the sync
 * outbox/changefeed, and so adding a new setting later never requires
 * another schema migration — a missing key just falls back to its default.
 * remindersEnabled stays in DataStore — it's a device-local notification
 * preference, not something that should sync across devices.
 */
class SettingsRepository(private val context: Context, private val settingsDao: SettingsDao) {

    private object Keys {
        val REMINDERS_ENABLED = booleanPreferencesKey("reminders_enabled")
    }

    val settings: Flow<AppSettings> = combine(settingsDao.observeAll(), context.settingsDataStore.data) { rows, prefs ->
        val values = rows.associate { it.key to it.value }
        AppSettings(
            lat = values[SettingsKeys.LAT]?.toDoubleOrNull() ?: 0.0,
            lng = values[SettingsKeys.LNG]?.toDoubleOrNull() ?: 0.0,
            cityName = values[SettingsKeys.CITY_NAME] ?: "",
            calculationMethod = values[SettingsKeys.CALCULATION_METHOD] ?: "MOON_SIGHTING_COMMITTEE",
            madhab = values[SettingsKeys.MADHAB] ?: "SHAFI",
            hijriAdjustment = values[SettingsKeys.HIJRI_ADJUSTMENT]?.toIntOrNull() ?: 0,
            remindersEnabled = prefs[Keys.REMINDERS_ENABLED] ?: false,
        )
    }

    suspend fun updateLocation(lat: Double, lng: Double, cityName: String) {
        val now = System.currentTimeMillis()
        settingsDao.upsertAll(
            listOf(
                SettingsEntry(SettingsKeys.LAT, lat.toString(), now),
                SettingsEntry(SettingsKeys.LNG, lng.toString(), now),
                SettingsEntry(SettingsKeys.CITY_NAME, cityName, now),
            )
        )
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
