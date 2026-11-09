package com.hvsna.app.data

import io.objectbox.annotation.Entity
import io.objectbox.annotation.Id
import io.objectbox.annotation.Index
import io.objectbox.annotation.Unique
import kotlinx.serialization.Serializable
import kotlinx.serialization.Transient
import java.util.UUID

/**
 * One Ramadan fast that is owed and must be made up (qadha). One row per day rather than a
 * counter, so each owed day keeps its Ramadan year and reason, and making one up is a single
 * field update ([madeUpOn]).
 *
 * Dates are ISO `LocalDate` strings ("2026-03-02"), not epoch millis: these are whole-day facts
 * and must not shift when the device's timezone changes.
 *
 * Follows [Task]'s identity conventions: [id] (UUID) is the logical key used by backup/restore;
 * [boxId] is ObjectBox's internal id and must be carried forward on any write that updates an
 * existing row. Soft-deleted via [deletedAt]. No `_dirty` column — sync no longer exists.
 *
 * Holds religious-practice data: never log these rows or their fields (Crashlytics included).
 */
@Serializable
@Entity
data class QadhaFast(
    @Unique @Index val id: String = UUID.randomUUID().toString(),
    /** The Hijri year of the Ramadan this fast is owed from. */
    @Index val ramadanHijriYear: Int,
    /** The Ramadan day that was missed; null for debt entered as a plain count. */
    val missedDate: String? = null,
    /** One of [QadhaReason]. */
    val reason: String,
    /** The ExemptionPeriod (haid/nifas log, not built yet) this row was generated from, if any. */
    @Index val sourcePeriodId: String? = null,
    /** The day the fast was made up; null while still owed. */
    val madeUpOn: String? = null,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis(),
    val deletedAt: Long? = null,
    @Transient @Id var boxId: Long = 0,
) {
    val isLive: Boolean get() = deletedAt == null
    val isOwed: Boolean get() = isLive && madeUpOn == null
}

object QadhaReason {
    const val HAID = "HAID"
    const val NIFAS = "NIFAS"
    const val TRAVEL = "TRAVEL"
    const val ILLNESS = "ILLNESS"
    const val PREGNANCY = "PREGNANCY"
    const val BREASTFEEDING = "BREASTFEEDING"
    const val OTHER = "OTHER"

    val all = listOf(HAID, NIFAS, TRAVEL, ILLNESS, PREGNANCY, BREASTFEEDING, OTHER)
}
