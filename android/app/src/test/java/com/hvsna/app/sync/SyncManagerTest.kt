package com.hvsna.app.sync

import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.delay
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.advanceTimeBy
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class SyncManagerTest {

    private fun TestScope.advance(ms: Long) {
        advanceTimeBy(ms)
        runCurrent()
    }

    @Test
    fun `notifyWrite fires a sync 1500ms after a single write, not before`() = runTest {
        var callCount = 0
        val manager = SyncManager(
            fullSync = { callCount++; false },
            canSync = { true },
            scope = this,
            isOnline = { true },
        )

        manager.notifyWrite()

        advance(SyncManager.WRITE_DEBOUNCE_MILLIS - 500)
        assertEquals(0, callCount)

        advance(500)
        assertEquals(1, callCount)
    }

    @Test
    fun `notifyWrite collapses a burst of writes into a single sync, 1500ms after the last one`() = runTest {
        var callCount = 0
        val manager = SyncManager(
            fullSync = { callCount++; false },
            canSync = { true },
            scope = this,
            isOnline = { true },
        )

        manager.notifyWrite()
        advance(500)
        manager.notifyWrite()
        advance(500)
        manager.notifyWrite()

        advance(SyncManager.WRITE_DEBOUNCE_MILLIS - 500)
        assertEquals(0, callCount)

        advance(500)
        assertEquals(1, callCount)
    }

    @Test
    fun `notifyWrite does not sync when offline at the debounce boundary`() = runTest {
        var callCount = 0
        val manager = SyncManager(
            fullSync = { callCount++; false },
            canSync = { true },
            scope = this,
            isOnline = { false },
        )

        manager.notifyWrite()
        advance(SyncManager.WRITE_DEBOUNCE_MILLIS + 500)

        assertEquals(0, callCount)
    }

    @Test
    fun `requestSync does not call fullSync when canSync is false`() = runTest {
        var callCount = 0
        val manager = SyncManager(
            fullSync = { callCount++; false },
            canSync = { false },
            scope = this,
            isOnline = { true },
        )

        manager.requestSync()
        advance(0)

        assertEquals(0, callCount)
    }

    @Test
    fun `requestSync calls fullSync immediately when canSync is true`() = runTest {
        var callCount = 0
        val manager = SyncManager(
            fullSync = { callCount++; false },
            canSync = { true },
            scope = this,
            isOnline = { true },
        )

        manager.requestSync()
        advance(0)

        assertEquals(1, callCount)
    }

    @Test
    fun `a requestSync while one is already in flight coalesces into one rerun, never running concurrently`() = runTest {
        var callCount = 0
        var inFlight = 0
        var maxConcurrent = 0
        val manager = SyncManager(
            fullSync = {
                inFlight++
                maxConcurrent = maxOf(maxConcurrent, inFlight)
                delay(100)
                callCount++
                inFlight--
                false
            },
            canSync = { true },
            scope = this,
            isOnline = { true },
        )

        manager.requestSync()
        advance(10) // let the first fullSync() start and suspend inside its delay(100)
        manager.requestSync() // arrives mid-flight — should coalesce into a rerun, not run concurrently

        advance(1000)

        assertEquals(2, callCount) // the original run, plus exactly one rerun
        assertEquals(1, maxConcurrent) // never two fullSync bodies in flight at once
    }

    @Test
    fun `runSync reports a failed sync to onSyncError`() = runTest {
        val failure = IllegalStateException("boom")
        val reported = mutableListOf<Throwable>()
        val manager = SyncManager(
            fullSync = { throw failure },
            canSync = { true },
            scope = this,
            isOnline = { true },
            onSyncError = { reported += it },
        )

        manager.runSync()

        assertEquals(listOf<Throwable>(failure), reported)
    }

    @Test
    fun `runSync does nothing when canSync is false`() = runTest {
        var callCount = 0
        val manager = SyncManager(
            fullSync = { callCount++; false },
            canSync = { false },
            scope = this,
            isOnline = { true },
        )

        manager.runSync()

        assertEquals(0, callCount)
    }
}
