package com.hvsna.app.data

import androidx.room.Entity
import androidx.room.PrimaryKey
import kotlinx.serialization.Serializable

@Serializable
@Entity(tableName = "settings")
data class SettingsEntry(
    @PrimaryKey val key: String,
    val value: String,
    val updatedAt: Long = 0L,
    val _dirty: Int = 1,
)

/**
 * Known keys stored in the `settings` key-value table. `LOCATION`,
 * `CALCULATION_METHOD`, `MADHAB`, and `HIJRI_ADJUSTMENT` are Android-local —
 * only `LOCATION` has a web/server counterpart (see SyncKeys.SETTINGS_ALLOWLIST
 * in the sync module) and is pushed/pulled with the same shape as
 * packages/app's `LocationSetting`; the calculation-method fields have no
 * web equivalent and are deliberately excluded from sync.
 */
object SettingsKeys {
    const val LOCATION = "location"
    const val CALCULATION_METHOD = "calculationMethod"
    const val MADHAB = "madhab"
    const val HIJRI_ADJUSTMENT = "hijriAdjustment"
}

/**
 * Value shape stored under [SettingsKeys.LOCATION], JSON-encoded — matches
 * packages/app/src/modules/settings/settings.ts's LocationSetting exactly so
 * a location update round-trips between web and Android through sync.
 */
@Serializable
data class LocationSettingValue(
    val source: String,
    val resolvedAt: Long,
    val lat: Double,
    val lng: Double,
    val name: String,
)
