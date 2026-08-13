package com.hvsna.app.data

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import kotlinx.serialization.Serializable
import java.util.UUID

@Serializable
@Entity(
    tableName = "task_tag_cross_ref",
    primaryKeys = ["taskId", "tagId"],
    foreignKeys = [
        ForeignKey(entity = Task::class, parentColumns = ["id"], childColumns = ["taskId"], onDelete = ForeignKey.CASCADE),
        ForeignKey(entity = Tag::class, parentColumns = ["id"], childColumns = ["tagId"], onDelete = ForeignKey.CASCADE),
    ],
    indices = [Index("taskId"), Index("tagId"), Index(value = ["uuid"], unique = true)],
)
data class TaskTagCrossRef(
    val taskId: Int,
    val tagId: Int,
    val uuid: String = UUID.randomUUID().toString(),
)
