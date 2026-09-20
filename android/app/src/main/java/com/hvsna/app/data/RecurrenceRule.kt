package com.hvsna.app.data

import io.objectbox.annotation.Entity
import io.objectbox.annotation.Id
import io.objectbox.annotation.Index
import io.objectbox.annotation.Unique
import io.objectbox.relation.ToMany
import kotlinx.serialization.Serializable
import kotlinx.serialization.Transient
import java.util.UUID

/** Valid [RecurrenceRule.recurringType] values — matches packages/app's TaskRecurringType. */
object RecurringType {
    const val NONE = "none"
    const val DAILY = "daily"
    const val WEEKLY = "weekly"
    const val MONTHLY = "monthly"
    const val YEARLY = "yearly"
}

/** Valid [RecurrenceRule.recurringEnd] values — matches packages/app's RecurringEnd union. */
object RecurringEnd {
    const val NEVER = "never"
    const val ON_DATE = "on_date"
    const val AFTER_OCCURRENCES = "after_occurrences"
}

/**
 * A recurring-task template. Concrete occurrences are computed lazily/on the
 * fly (see RecurrenceGenerator) rather than materialized ahead of time —
 * this row is never itself a task, matching packages/app's
 * recurring-task-generator.ts model exactly so both platforms compute the
 * same occurrences from the same template. `useGregorian`/`hijriDateOffset`
 * are carried for wire compatibility only — no Hijri-calendar recurrence
 * algorithm exists on the web side either, so this field is inert here too.
 *
 * See [Task]'s doc comment for why [boxId] exists alongside [id].
 */
@Serializable
@Entity
data class RecurrenceRule(
    @Unique @Index val id: String = UUID.randomUUID().toString(),
    val title: String,
    val description: String,
    val recurringType: String,
    val recurringInterval: Int,
    val baseDateEpoch: Long,
    val atTime: String? = null,
    val lat: Double? = null,
    val lng: Double? = null,
    val timezone: String? = null,
    val hijriDateOffset: Int? = null,
    val recurringEnd: String? = null,
    val recurringEndEpoch: Long? = null,
    val recurringEndOccurrences: Int? = null,
    val useGregorian: Boolean = false,
    /** JSON array of "YYYYMMDD" date strings whose virtual occurrence is suppressed. */
    val occurrenceExceptions: String? = null,
    val reminderEnabled: Boolean = false,
    val reminderOffsetMinutes: Int = 0,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis(),
    val deletedAt: Long? = null,
    val _dirty: Int = 1,
    @Transient @Id var boxId: Long = 0,
) {
    /**
     * Standalone many-to-many relation to Tag, independent from Task.tags —
     * only touched by TaskStore. See [Task.tags]'s doc comment for why this
     * is deliberately uninitialized.
     */
    @Transient lateinit var tags: ToMany<Tag>
}
