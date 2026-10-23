package com.hvsna.app.sync

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import java.io.ByteArrayOutputStream
import java.util.zip.GZIPInputStream
import java.util.zip.GZIPOutputStream

/** [SyncRecord.type] values. */
object RecordType {
    const val TASK = "task"
    const val TAG = "tag"
    const val RULE = "rule"
    const val SETTING = "setting"
}

/**
 * One synced row. [data] is the row's own JSON (the entity's serialized
 * fields, plus `tagIds` for tasks and rules) and is opaque to the merge,
 * which only looks at [type], [id] and [hlc] — so this module needs no copy
 * of the entity classes, and a desktop client can carry its own.
 */
@Serializable
data class SyncRecord(
    val type: String,
    val id: String,
    val hlc: String,
    val data: JsonObject,
) {
    val key: String get() = "$type/$id"
}

/**
 * The content of one device's file in synced storage: that device's full
 * merged state, deleted rows included. Only the owning device ever writes
 * it, so concurrent writers can't overwrite each other.
 */
@Serializable
data class SyncFile(
    val formatVersion: Int,
    val deviceId: String,
    val deviceName: String,
    val writtenAt: Long,
    /** Reserved for passphrase encryption; null means [records] are plain. */
    val enc: String? = null,
    val records: List<SyncRecord>,
)

/** Gzipped JSON encoding of [SyncFile]. */
object SyncCodec {
    /** Bump when a reader of the previous version would misread or lose data in the new one. */
    const val CURRENT_FORMAT_VERSION = 1

    private val json = Json { ignoreUnknownKeys = true }

    fun encode(file: SyncFile): ByteArray {
        val out = ByteArrayOutputStream()
        GZIPOutputStream(out).use { it.write(json.encodeToString(SyncFile.serializer(), file).toByteArray(Charsets.UTF_8)) }
        return out.toByteArray()
    }

    fun decode(bytes: ByteArray): SyncFile =
        json.decodeFromString(SyncFile.serializer(), GZIPInputStream(bytes.inputStream()).use { it.readBytes() }.toString(Charsets.UTF_8))
}
