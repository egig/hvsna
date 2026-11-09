package com.hvsna.app.backup

import com.hvsna.app.data.QadhaFast
import com.hvsna.app.data.RecurrenceRule
import com.hvsna.app.data.RecurrenceRuleTagCrossRef
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
    val recurrenceRuleTagCrossRefs: List<RecurrenceRuleTagCrossRef> = emptyList(),
    /** Added in format 4. Absent (empty) in older files — see [hasQadha]. */
    val qadhaFasts: List<QadhaFast> = emptyList(),
) {
    /**
     * Whether this file carries a qadha section at all. A format-3 file predates the tracker, so a
     * Replace import of it must leave the device's qadha rows alone rather than wipe them.
     */
    val hasQadha: Boolean get() = formatVersion >= QADHA_FORMAT_VERSION

    companion object {
        const val CURRENT_FORMAT_VERSION = 4
        const val QADHA_FORMAT_VERSION = 4
    }
}
