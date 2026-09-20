package com.hvsna.app.data

import kotlinx.serialization.Serializable

/** Plain DTO — see [TaskTagCrossRef]'s doc comment; same reasoning for RecurrenceRule.tags. */
@Serializable
data class RecurrenceRuleTagCrossRef(
    val ruleId: String,
    val tagId: String,
)
