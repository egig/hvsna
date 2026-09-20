package com.hvsna.app.data

import io.objectbox.annotation.Entity
import io.objectbox.annotation.Id
import io.objectbox.annotation.Index
import io.objectbox.annotation.Unique
import kotlinx.serialization.Serializable
import kotlinx.serialization.Transient

@Serializable
@Entity
data class SettingsEntry(
    @Unique @Index val key: String,
    val value: String,
    val updatedAt: Long = 0L,
    val _dirty: Int = 1,
    @Transient @Id var boxId: Long = 0,
)

/**
 * Known keys stored in the `settings` key-value table. `LOCATION` and
 * `HIJRI_MONTH_OFFSETS` have web/server counterparts and sync: `LOCATION`
 * matches packages/app's `LocationSetting` shape exactly, and
 * `HIJRI_MONTH_OFFSETS` matches packages/app's `GeneralSettings.hijriMonthOffsets`
 * (JSON object of Hijri month "1".."12" -> signed day offset, non-zero
 * entries only — mirrors how a JS object with numeric keys serializes).
 * `CALCULATION_METHOD` and `MADHAB` have no web equivalent and are
 * deliberately excluded from sync.
 */
object SettingsKeys {
    const val LOCATION = "location"
    const val CALCULATION_METHOD = "calculationMethod"
    const val MADHAB = "madhab"
    const val HIJRI_MONTH_OFFSETS = "hijriMonthOffsets"
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
