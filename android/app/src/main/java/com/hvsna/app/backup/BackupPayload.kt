package com.hvsna.app.backup

import com.hvsna.app.data.RecurrenceRule
import com.hvsna.app.data.Tag
import com.hvsna.app.data.Task
import com.hvsna.app.data.TaskTagCrossRef
import kotlinx.serialization.Serializable

@Serializable
data class BackupPayload(
    val formatVersion: Int = CURRENT_FORMAT_VERSION,
    val exportedAtEpochMillis: Long,
    val tasks: List<Task>,
    val tags: List<Tag>,
    val taskTagCrossRefs: List<TaskTagCrossRef>,
    val recurrenceRules: List<RecurrenceRule>,
) {
    companion object {
        const val CURRENT_FORMAT_VERSION = 2
    }
}
