package com.hvsna.app.sync

import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import java.security.MessageDigest

/** A file in synced storage, as listed. */
data class RemoteFile(val id: String, val name: String, val md5: String?)

/** Synced storage: one folder, flat files. [DriveClient] is the real one. */
interface RemoteStore {
    suspend fun list(): List<RemoteFile>
    suspend fun download(id: String): ByteArray
    suspend fun create(name: String, bytes: ByteArray): RemoteFile
    suspend fun update(id: String, bytes: ByteArray): RemoteFile
    suspend fun delete(id: String)
}

/** This device's rows. On Android, `SyncLocalStore`. */
interface LocalRecords {
    fun snapshot(): List<SyncRecord>

    /** Writes [records] with their own timestamps; returns the ids of tasks that changed. */
    fun apply(records: List<SyncRecord>): Set<String>
}

/** Bookkeeping that must survive between sync cycles. */
interface SyncBookkeeping {
    /** Digest of the record set last uploaded, or null if this device never uploaded. */
    var uploadedDigest: String?

    /** Remote file id → md5 of the version last merged, so unchanged peer files aren't downloaded again. */
    var mergedChecksums: Map<String, String>

    /** Id of this device's own file, kept in case a listing right after creating it doesn't show it yet. */
    var ownFileId: String?
}

sealed interface SyncOutcome {
    data class Synced(
        val appliedRecords: Int,
        val changedTaskIds: Set<String>,
        val uploaded: Boolean,
        val skippedRecords: Int,
        val blockingDevices: List<String>,
    ) : SyncOutcome

    /** The access token was refused; the user has to reconnect. */
    data object NeedsAuthorization : SyncOutcome

    data class Failed(val error: Throwable) : SyncOutcome
}

/** Thrown by a [RemoteStore] when the server rejects the credentials. */
class SyncAuthException(message: String) : Exception(message)

/** Thrown by a [RemoteStore] when the file to update or delete no longer exists. */
class SyncNotFoundException(message: String) : Exception(message)

/**
 * One sync cycle: read the other devices' files, apply the records that win,
 * then upload this device's full state to its own file if it changed since
 * the last upload. Cycles are serialized by [mutex]; one engine per process.
 */
class SyncEngine(
    private val remote: RemoteStore,
    private val local: LocalRecords,
    private val bookkeeping: SyncBookkeeping,
    private val deviceId: String,
    private val deviceName: String,
    private val now: () -> Long = System::currentTimeMillis,
) {
    private val mutex = Mutex()

    val ownFileName: String get() = fileName(deviceId)

    suspend fun run(): SyncOutcome = mutex.withLock {
        try {
            cycle()
        } catch (e: SyncAuthException) {
            SyncOutcome.NeedsAuthorization
        } catch (e: kotlinx.coroutines.CancellationException) {
            throw e
        } catch (e: Exception) {
            SyncOutcome.Failed(e)
        }
    }

    /** Deletes every file in synced storage, this device's and its peers'. Local data is untouched. */
    suspend fun deleteRemoteData() = mutex.withLock {
        remote.list().filter { it.name.startsWith(FILE_PREFIX) }.forEach { deleteIfPresent(it.id) }
        bookkeeping.uploadedDigest = null
        bookkeeping.mergedChecksums = emptyMap()
        bookkeeping.ownFileId = null
    }

    private suspend fun deleteIfPresent(id: String) {
        try {
            remote.delete(id)
        } catch (e: SyncNotFoundException) {
            // Already gone.
        }
    }

    private suspend fun cycle(): SyncOutcome {
        val files = remote.list().filter { it.name.startsWith(FILE_PREFIX) && it.name.endsWith(FILE_SUFFIX) }
        val ownFiles = files.filter { it.name == ownFileName }
        val peerFiles = files.filter { it.name != ownFileName }

        val previousChecksums = bookkeeping.mergedChecksums
        val toRead = peerFiles.filter { it.md5 == null || previousChecksums[it.id] != it.md5 }
        // A download error fails the cycle; a file that downloads but doesn't decode is skipped (and retried next cycle).
        val remotes = toRead.mapNotNull { file ->
            val bytes = remote.download(file.id)
            runCatching { SyncCodec.decode(bytes) }.getOrNull()?.let { file to it }
        }

        val plan = MergePlanner.plan(local.snapshot(), remotes.map { it.second }, deviceId, now())
        val changedTaskIds = local.apply(plan.apply)

        // Remember a peer file as merged only if nothing in it was held back,
        // so a file from a blocking device is read again once this app updates.
        val blockingIds = remotes.filter { (_, f) -> f.formatVersion > SyncCodec.CURRENT_FORMAT_VERSION || f.enc != null }
            .map { it.first.id }.toSet()
        bookkeeping.mergedChecksums = peerFiles.mapNotNull { file ->
            val md5 = file.md5 ?: return@mapNotNull null
            when {
                file.id in blockingIds -> null
                file in toRead && remotes.none { it.first.id == file.id } -> null // didn't decode
                file in toRead -> file.id to md5
                else -> previousChecksums[file.id]?.let { file.id to it }
            }
        }.toMap()

        var uploaded = false
        if (plan.canUpload) {
            val records = local.snapshot()
            val digest = digest(records)
            if (ownFiles.isNotEmpty() && ownFiles.none { it.id == bookkeeping.ownFileId }) {
                bookkeeping.ownFileId = ownFiles.first().id
            }
            val knownId = bookkeeping.ownFileId
            if (ownFiles.isEmpty() || digest != bookkeeping.uploadedDigest) {
                val bytes = SyncCodec.encode(
                    SyncFile(SyncCodec.CURRENT_FORMAT_VERSION, deviceId, deviceName, now(), null, records),
                )
                val written = knownId?.let { id ->
                    try {
                        remote.update(id, bytes)
                    } catch (e: SyncNotFoundException) {
                        null
                    }
                } ?: remote.create(ownFileName, bytes)
                bookkeeping.ownFileId = written.id
                bookkeeping.uploadedDigest = digest
                uploaded = true
            }
            // Duplicates of this device's file (two creates racing a listing) hold nothing the kept one lacks.
            ownFiles.filter { it.id != bookkeeping.ownFileId }.forEach { deleteIfPresent(it.id) }
        }

        return SyncOutcome.Synced(plan.apply.size, changedTaskIds, uploaded, plan.skippedRecords, plan.blockingDevices)
    }

    companion object {
        const val FILE_PREFIX = "dev-"
        const val FILE_SUFFIX = ".json.gz"

        fun fileName(deviceId: String) = "$FILE_PREFIX$deviceId$FILE_SUFFIX"

        /** Order-independent digest of which records exist at which timestamps. */
        fun digest(records: Collection<SyncRecord>): String {
            val md = MessageDigest.getInstance("SHA-256")
            records.map { "${it.key}@${it.hlc}" }.sorted().forEach { md.update(it.toByteArray(Charsets.UTF_8)); md.update(0) }
            return md.digest().joinToString("") { "%02x".format(it) }
        }
    }
}
