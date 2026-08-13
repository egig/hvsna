package com.hvsna.app.backup

import android.content.Context
import android.net.Uri
import com.hvsna.app.data.TaskRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json

class BackupFileService(
    private val repository: TaskRepository,
    private val context: Context,
) {
    private val json = Json { ignoreUnknownKeys = true }

    suspend fun exportTo(uri: Uri): Result<Unit> = withContext(Dispatchers.IO) {
        runCatching {
            val payload = BackupPayload(
                exportedAtEpochMillis = System.currentTimeMillis(),
                tasks = repository.getAllTasksSnapshot(),
                tags = repository.getAllTags().first(),
                taskTagCrossRefs = repository.getAllTaskTagCrossRefsSnapshot(),
                recurrenceRules = repository.getAllRecurrenceRules().first(),
            )
            val text = json.encodeToString(BackupPayload.serializer(), payload)
            context.contentResolver.openOutputStream(uri)?.use { out ->
                out.write(text.toByteArray(Charsets.UTF_8))
            } ?: error("Unable to open output stream")
        }
    }

    suspend fun importReplacing(uri: Uri): Result<Unit> = withContext(Dispatchers.IO) {
        runCatching {
            val payload = readPayload(uri)
            repository.replaceAll(
                tasks = payload.tasks,
                tags = payload.tags,
                taskTagCrossRefs = payload.taskTagCrossRefs,
                recurrenceRules = payload.recurrenceRules,
            )
        }
    }

    suspend fun importMerging(uri: Uri): Result<Unit> = withContext(Dispatchers.IO) {
        runCatching {
            val payload = readPayload(uri)
            repository.mergeAll(
                tasks = payload.tasks,
                tags = payload.tags,
                taskTagCrossRefs = payload.taskTagCrossRefs,
                recurrenceRules = payload.recurrenceRules,
            )
        }
    }

    private fun readPayload(uri: Uri): BackupPayload {
        val text = context.contentResolver.openInputStream(uri)?.use { input ->
            input.readBytes().toString(Charsets.UTF_8)
        } ?: error("Unable to open input stream")
        val payload = json.decodeFromString(BackupPayload.serializer(), text)
        require(payload.formatVersion <= BackupPayload.CURRENT_FORMAT_VERSION) {
            "This backup was created by a newer version of the app."
        }
        return payload
    }
}
