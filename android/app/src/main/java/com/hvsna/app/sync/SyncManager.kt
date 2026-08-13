package com.hvsna.app.sync

import kotlinx.coroutines.CoroutineScope
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
    private val engine: SyncEngine,
    private val isAuthenticated: suspend () -> Boolean,
    private val scope: CoroutineScope,
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

    suspend fun runSync() {
        if (!isAuthenticated()) return
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
                runCatching { engine.fullSync() }
                _lastSyncedAt.value = System.currentTimeMillis()
            } while (rerunRequested)
        } finally {
            mutex.withLock { running = false }
            _isSyncing.value = false
        }
    }
}
