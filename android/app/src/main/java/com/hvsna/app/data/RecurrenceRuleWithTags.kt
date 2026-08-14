package com.hvsna.app.data

import androidx.room.Embedded
import androidx.room.Junction
import androidx.room.Relation

data class RecurrenceRuleWithTags(
    @Embedded val rule: RecurrenceRule,
    @Relation(
        parentColumn = "id",
        entityColumn = "id",
        associateBy = Junction(RecurrenceRuleTagCrossRef::class, parentColumn = "ruleId", entityColumn = "tagId"),
    )
    val tags: List<Tag>,
)
