package com.hvsna.app.sync

import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock

/**
 * Coalesces overlapping sync runs the same way packages/app's SyncProvider's
 * runSync() does: an in-flight sync flags a rerun instead of running
 * concurrently with, or silently dropping, a newly-requested one.
 */
class SyncManager(
    private val fullSync: suspend () -> Boolean,
    private val canSync: suspend () -> Boolean,
    private val scope: CoroutineScope,
    private val isOnline: () -> Boolean,
) {
    private val mutex = Mutex()
    private var running = false
    private var rerunRequested = false
    private var manualRequested = false

    private val _isSyncing = MutableStateFlow(false)
    val isSyncing: StateFlow<Boolean> = _isSyncing

    /** True only while a user-initiated (pull-to-refresh / "Sync now") sync is in flight —
     * write-triggered and periodic background syncs never set this, so they stay invisible. */
    private val _isManualSyncing = MutableStateFlow(false)
    val isManualSyncing: StateFlow<Boolean> = _isManualSyncing

    private val _lastSyncedAt = MutableStateFlow<Long?>(null)
    val lastSyncedAt: StateFlow<Long?> = _lastSyncedAt

    /** Fire-and-forget — safe to call from any of the manual/reconnect/sign-in/periodic triggers.
     * Pass manual=true only for a directly user-initiated sync (pull-to-refresh, "Sync now"). */
    fun requestSync(manual: Boolean = false) {
        scope.launch { runSync(manual) }
    }

    private var writeDebounceJob: Job? = null

    /** Debounced (~1.5s trailing) write-triggered sync — a burst of local writes collapses into
     * one sync instead of one per write. Skipped while offline; the reconnect trigger catches up
     * once connectivity returns, so a failed attempt here is never the last chance to sync. Always
     * background (manual=false) — writes must never surface the pull-to-refresh indicator. */
    fun notifyWrite() {
        writeDebounceJob?.cancel()
        writeDebounceJob = scope.launch {
            delay(WRITE_DEBOUNCE_MILLIS)
            if (isOnline()) requestSync(manual = false)
        }
    }

    suspend fun runSync(manual: Boolean = false) {
        if (!canSync()) return
        val shouldRun = mutex.withLock {
            if (running) {
                rerunRequested = true
                if (manual) manualRequested = true
                false
            } else {
                running = true
                manualRequested = manual
                true
            }
        }
        if (!shouldRun) return

        _isSyncing.value = true
        try {
            do {
                rerunRequested = false
                val runManual = mutex.withLock { manualRequested }
                _isManualSyncing.value = runManual
                runCatching { fullSync() }
                _lastSyncedAt.value = System.currentTimeMillis()
                mutex.withLock { manualRequested = false }
            } while (rerunRequested)
        } finally {
            mutex.withLock { running = false; manualRequested = false }
            _isSyncing.value = false
            _isManualSyncing.value = false
        }
    }

    companion object {
        const val WRITE_DEBOUNCE_MILLIS = 1500L
    }
}
