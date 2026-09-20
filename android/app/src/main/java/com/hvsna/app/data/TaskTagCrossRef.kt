package com.hvsna.app.data

import kotlinx.serialization.Serializable

/**
 * Plain DTO, not an ObjectBox entity — storage-side, a Task-to-Tag
 * association is a [Task.tags] ToMany relation, not a join table. This
 * shape survives only at the backup JSON (BackupPayload) and
 * TaskRepository.replaceAll/mergeAll boundary, so the export/import file
 * format stays stable regardless of how tags are actually stored.
 */
@Serializable
data class TaskTagCrossRef(
    val taskId: String,
    val tagId: String,
)
