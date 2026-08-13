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
)

/** Known keys stored in the `settings` key-value table. */
object SettingsKeys {
    const val LAT = "lat"
    const val LNG = "lng"
    const val CITY_NAME = "cityName"
    const val CALCULATION_METHOD = "calculationMethod"
    const val MADHAB = "madhab"
    const val HIJRI_ADJUSTMENT = "hijriAdjustment"
}
