package com.hvsna.app.data

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey
import kotlinx.serialization.Serializable
import java.util.UUID

enum class RecurrenceUnit { DAY, WEEK, MONTH }

@Serializable
@Entity(tableName = "recurrence_rule", indices = [Index(value = ["uuid"], unique = true)])
data class RecurrenceRule(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val title: String,
    val description: String,
    val intervalCount: Int,
    val unit: String,
    val anchorEpochDay: Long,
    val nextOccurrenceIndex: Int,
    val hour: Int? = null,
    val minute: Int? = null,
    val prayerName: String? = null,
    val isAllDay: Boolean = false,
    val reminderEnabled: Boolean = false,
    val reminderOffsetMinutes: Int = 0,
    val uuid: String = UUID.randomUUID().toString(),
)
