package com.hvsna.app.data

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey
import kotlinx.serialization.Serializable
import java.util.UUID

@Serializable
@Entity(
    foreignKeys = [
        ForeignKey(
            entity = RecurrenceRule::class,
            parentColumns = ["id"],
            childColumns = ["recurrenceId"],
            onDelete = ForeignKey.SET_NULL,
        ),
    ],
    indices = [Index("recurrenceId"), Index(value = ["uuid"], unique = true)],
)
data class Task(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val title: String,
    val description: String,
    val scheduledTime: Long?,
    val isDone: Int = 0,
    val prayerName: String? = null,
    val completedTime: Long? = null,
    val isAllDay: Boolean = false,
    val recurrenceId: Int? = null,
    val reminderEnabled: Boolean = false,
    val reminderOffsetMinutes: Int = 0,
    val uuid: String = UUID.randomUUID().toString(),
)
