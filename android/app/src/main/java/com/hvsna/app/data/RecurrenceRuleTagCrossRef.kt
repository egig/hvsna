package com.hvsna.app.data

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import kotlinx.serialization.Serializable

@Serializable
@Entity(
    tableName = "recurrence_rule_tag_cross_ref",
    primaryKeys = ["ruleId", "tagId"],
    foreignKeys = [
        ForeignKey(entity = RecurrenceRule::class, parentColumns = ["id"], childColumns = ["ruleId"], onDelete = ForeignKey.CASCADE),
        ForeignKey(entity = Tag::class, parentColumns = ["id"], childColumns = ["tagId"], onDelete = ForeignKey.CASCADE),
    ],
    indices = [Index("ruleId"), Index("tagId")],
)
data class RecurrenceRuleTagCrossRef(
    val ruleId: String,
    val tagId: String,
)
