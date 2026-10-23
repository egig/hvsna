package com.hvsna.app.drive

import android.content.Context
import com.hvsna.app.sync.SyncBookkeeping
import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.builtins.MapSerializer
import kotlinx.serialization.builtins.serializer
import kotlinx.serialization.json.Json

/** What the Sync screen shows about the last cycle. */
data class DriveSyncStatus(
    val enabled: Boolean,
    val lastSyncedAt: Long?,
    val state: State,
    val errorMessage: String?,
    val blockingDevices: List<String>,
    val skippedRecords: Int,
) {
    enum class State { NEVER, OK, NEEDS_AUTHORIZATION, FAILED }
}

/**
 * Sync settings and bookkeeping in SharedPreferences (read synchronously by
 * the engine between suspension points; tiny values only).
 */
class DriveSyncPrefs(context: Context) : SyncBookkeeping {
    private val prefs = context.applicationContext.getSharedPreferences("drive_sync", Context.MODE_PRIVATE)
    private val json = Json { ignoreUnknownKeys = true }
    private val checksumsSerializer = MapSerializer(String.serializer(), String.serializer())
    private val devicesSerializer = ListSerializer(String.serializer())

    var enabled: Boolean
        get() = prefs.getBoolean(KEY_ENABLED, false)
        set(value) = prefs.edit().putBoolean(KEY_ENABLED, value).apply()

    override var uploadedDigest: String?
        get() = prefs.getString(KEY_UPLOADED_DIGEST, null)
        set(value) = prefs.edit().putString(KEY_UPLOADED_DIGEST, value).apply()

    override var mergedChecksums: Map<String, String>
        get() = prefs.getString(KEY_MERGED_CHECKSUMS, null)
            ?.let { runCatching { json.decodeFromString(checksumsSerializer, it) }.getOrNull() }
            ?: emptyMap()
        set(value) = prefs.edit().putString(KEY_MERGED_CHECKSUMS, json.encodeToString(checksumsSerializer, value)).apply()

    override var ownFileId: String?
        get() = prefs.getString(KEY_OWN_FILE_ID, null)
        set(value) = prefs.edit().putString(KEY_OWN_FILE_ID, value).apply()

    fun status(): DriveSyncStatus = DriveSyncStatus(
        enabled = enabled,
        lastSyncedAt = prefs.getLong(KEY_LAST_SYNCED_AT, 0L).takeIf { it > 0 },
        state = prefs.getString(KEY_STATE, null)
            ?.let { runCatching { DriveSyncStatus.State.valueOf(it) }.getOrNull() }
            ?: DriveSyncStatus.State.NEVER,
        errorMessage = prefs.getString(KEY_ERROR, null),
        blockingDevices = prefs.getString(KEY_BLOCKING, null)
            ?.let { runCatching { json.decodeFromString(devicesSerializer, it) }.getOrNull() }
            .orEmpty(),
        skippedRecords = prefs.getInt(KEY_SKIPPED, 0),
    )

    fun recordOutcome(
        state: DriveSyncStatus.State,
        at: Long?,
        errorMessage: String? = null,
        blockingDevices: List<String> = emptyList(),
        skippedRecords: Int = 0,
    ) {
        prefs.edit()
            .putString(KEY_STATE, state.name)
            .apply { if (at != null) putLong(KEY_LAST_SYNCED_AT, at) }
            .putString(KEY_ERROR, errorMessage)
            .putString(KEY_BLOCKING, json.encodeToString(devicesSerializer, blockingDevices))
            .putInt(KEY_SKIPPED, skippedRecords)
            .apply()
    }

    /** Forgets everything but the device id (kept in SyncClock's own prefs). */
    fun reset() {
        prefs.edit().clear().apply()
    }

    private companion object {
        const val KEY_ENABLED = "enabled"
        const val KEY_UPLOADED_DIGEST = "uploaded_digest"
        const val KEY_MERGED_CHECKSUMS = "merged_checksums"
        const val KEY_OWN_FILE_ID = "own_file_id"
        const val KEY_LAST_SYNCED_AT = "last_synced_at"
        const val KEY_STATE = "state"
        const val KEY_ERROR = "error"
        const val KEY_BLOCKING = "blocking_devices"
        const val KEY_SKIPPED = "skipped_records"
    }
}
