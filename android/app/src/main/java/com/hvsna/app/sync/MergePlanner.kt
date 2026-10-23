package com.hvsna.app.sync

/**
 * What a sync cycle should do after reading the other devices' files.
 *
 * @property apply remote records that beat the local copy (or have none),
 *   to be written locally with their own timestamps.
 * @property skippedRecords remote records ignored because their timestamp is
 *   malformed or more than [MergePlanner.MAX_FUTURE_SKEW_MILLIS] ahead of now
 *   (a device with a wrong clock would otherwise win every conflict and drag
 *   every other clock forward).
 * @property blockingDevices names of devices whose file this app can't read
 *   (newer format, or encrypted). While any exist, this device must not
 *   upload: it would rewrite their records without fields it doesn't know.
 */
data class MergePlan(
    val apply: List<SyncRecord>,
    val skippedRecords: Int,
    val blockingDevices: List<String>,
) {
    val canUpload: Boolean get() = blockingDevices.isEmpty()
}

object MergePlanner {
    const val MAX_FUTURE_SKEW_MILLIS = 24 * 60 * 60 * 1000L

    /**
     * @param local this device's records, each with its effective timestamp
     *   (see [Hlc.effective]).
     * @param remotes every device file read from synced storage; this
     *   device's own file is ignored.
     */
    fun plan(
        local: Collection<SyncRecord>,
        remotes: Collection<SyncFile>,
        ownDeviceId: String,
        now: Long,
    ): MergePlan {
        val blocking = mutableListOf<String>()
        var skipped = 0
        val candidates = mutableListOf<SyncRecord>()
        for (file in remotes) {
            if (file.deviceId == ownDeviceId) continue
            if (file.formatVersion > SyncCodec.CURRENT_FORMAT_VERSION || file.enc != null) {
                blocking += file.deviceName.ifBlank { file.deviceId }
                continue
            }
            for (record in file.records) {
                val hlc = Hlc.parseOrNull(record.hlc)
                if (hlc == null || hlc.physicalMillis > now + MAX_FUTURE_SKEW_MILLIS) skipped++ else candidates += record
            }
        }

        val localByKey = local.associateBy { it.key }
        val winners = LwwMerge.merge(local, candidates, SyncRecord::key, SyncRecord::hlc)
        val apply = winners.values.filter { winner ->
            val current = localByKey[winner.key]
            current == null || current.hlc != winner.hlc
        }
        return MergePlan(apply.sortedBy { it.key }, skipped, blocking)
    }
}
