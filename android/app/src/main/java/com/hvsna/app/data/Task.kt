package com.hvsna.app.data

import io.objectbox.annotation.Entity
import io.objectbox.annotation.Id
import io.objectbox.annotation.Index
import io.objectbox.annotation.Unique
import io.objectbox.relation.ToMany
import kotlinx.serialization.Serializable
import kotlinx.serialization.Transient
import java.util.UUID

/**
 * `atTime` is overloaded the same way as packages/app's wire `at_time`
 * column: a value containing `:` is a literal "HH:mm" clock time, a value
 * with no `:` is a prayer name (see PrayerTime.isPrayerBased), and `null`
 * means "all day" / end-of-day — there's no separate isAllDay flag, matching
 * the web model exactly so this field round-trips through sync unchanged.
 *
 * [boxId] is ObjectBox's native 64-bit id, used only for storage — [id] (a
 * UUID) remains the logical primary key everywhere else (wire sync, backup
 * JSON, UI), so [boxId] is excluded from JSON via @Transient. There is no
 * FK-cascade to [RecurrenceRule] anymore (ObjectBox doesn't enforce SQL
 * foreign keys) — nothing relied on that cascade; deletion paths always
 * soft-delete explicitly (see TaskStore).
 */
@Serializable
@Entity
data class Task(
    @Unique @Index val id: String = UUID.randomUUID().toString(),
    val title: String,
    val description: String,
    val scheduledTime: Long?,
    val isDone: Int = 0,
    val atTime: String? = null,
    val completedTime: Long? = null,
    @Index val recurringTaskId: String? = null,
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
    @Transient @Id var boxId: Long = 0,
) {
    /**
     * Standalone many-to-many relation to Tag — no join-table entity
     * needed. Only touched by TaskStore. Deliberately uninitialized: the
     * ObjectBox Gradle plugin bytecode-transforms this class's
     * constructor(s) — including the one `copy()` calls — to wire it up
     * automatically (see
     * https://docs.objectbox.io/relations#initialization-magic).
     */
    @Transient lateinit var tags: ToMany<Tag>
}
