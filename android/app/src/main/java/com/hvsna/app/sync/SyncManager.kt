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

    private val _isSyncing = MutableStateFlow(false)
    val isSyncing: StateFlow<Boolean> = _isSyncing

    private val _lastSyncedAt = MutableStateFlow<Long?>(null)
    val lastSyncedAt: StateFlow<Long?> = _lastSyncedAt

    /** Fire-and-forget — safe to call from any of the manual/reconnect/sign-in/periodic triggers. */
    fun requestSync() {
        scope.launch { runSync() }
    }

    private var writeDebounceJob: Job? = null

    /** Debounced (~1.5s trailing) write-triggered sync — a burst of local writes collapses into
     * one sync instead of one per write. Skipped while offline; the reconnect trigger catches up
     * once connectivity returns, so a failed attempt here is never the last chance to sync. */
    fun notifyWrite() {
        writeDebounceJob?.cancel()
        writeDebounceJob = scope.launch {
            delay(WRITE_DEBOUNCE_MILLIS)
            if (isOnline()) requestSync()
        }
    }

    suspend fun runSync() {
        if (!canSync()) return
        val shouldRun = mutex.withLock {
            if (running) {
                rerunRequested = true
                false
            } else {
                running = true
                true
            }
        }
        if (!shouldRun) return

        _isSyncing.value = true
        try {
            do {
                rerunRequested = false
                runCatching { fullSync() }
                _lastSyncedAt.value = System.currentTimeMillis()
            } while (rerunRequested)
        } finally {
            mutex.withLock { running = false }
            _isSyncing.value = false
        }
    }

    companion object {
        const val WRITE_DEBOUNCE_MILLIS = 1500L
    }
}
