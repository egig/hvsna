package com.hvsna.app.data

/** Plain data class — assembled by TaskStore from a RecurrenceRule and its `tags` ToMany relation. */
data class RecurrenceRuleWithTags(
    val rule: RecurrenceRule,
    val tags: List<Tag>,
)
