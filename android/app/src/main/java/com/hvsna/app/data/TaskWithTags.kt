package com.hvsna.app.data

import androidx.room.Embedded
import androidx.room.Junction
import androidx.room.Relation

data class TaskWithTags(
    @Embedded val task: Task,
    @Relation(
        parentColumn = "id",
        entityColumn = "id",
        associateBy = Junction(TaskTagCrossRef::class, parentColumn = "taskId", entityColumn = "tagId"),
    )
    val tags: List<Tag>,
)
