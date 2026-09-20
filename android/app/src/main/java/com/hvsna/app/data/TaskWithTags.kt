package com.hvsna.app.data

/** Plain data class — assembled by TaskStore from a Task and its `tags` ToMany relation. */
data class TaskWithTags(
    val task: Task,
    val tags: List<Tag>,
)
