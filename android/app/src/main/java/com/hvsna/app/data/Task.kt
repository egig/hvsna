package com.hvsna.app.data

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey
import kotlinx.serialization.Serializable
import java.util.UUID

/**
 * `atTime` is overloaded the same way as packages/app's wire `at_time`
 * column: a value containing `:` is a literal "HH:mm" clock time, a value
 * with no `:` is a prayer name (see PrayerTime.isPrayerBased), and `null`
 * means "all day" / end-of-day — there's no separate isAllDay flag, matching
 * the web model exactly so this field round-trips through sync unchanged.
 */
@Serializable
@Entity(
    foreignKeys = [
        ForeignKey(
            entity = RecurrenceRule::class,
            parentColumns = ["id"],
            childColumns = ["recurringTaskId"],
            onDelete = ForeignKey.SET_NULL,
        ),
    ],
    indices = [Index("recurringTaskId")],
)
data class Task(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    val title: String,
    val description: String,
    val scheduledTime: Long?,
    val isDone: Int = 0,
    val atTime: String? = null,
    val completedTime: Long? = null,
    val recurringTaskId: String? = null,
    /** Copied from the owning RecurrenceRule at materialization time; carried metadata, not authoritative. */
    val recurringType: String? = null,
    val recurringInterval: Int? = null,
    /** Write-once provenance from the location/timezone settings active when created — never read back for prayer-time computation, which always uses the device's current location setting. */
    val lat: Double? = null,
    val lng: Double? = null,
    val timezone: String? = null,
    val hijriDateOffset: Int? = null,
    val reminderEnabled: Boolean = false,
    val reminderOffsetMinutes: Int = 0,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis(),
    val deletedAt: Long? = null,
    val _dirty: Int = 1,
)
