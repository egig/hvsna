package com.hvsna.app.ui

import com.hvsna.app.data.Task
import com.hvsna.app.data.TaskWithTags
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.advanceTimeBy
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class CompletionGraceTrackerTest {

    private val grace = 450L

    // id == title so assertions can address rows by a readable key.
    private fun task(title: String, done: Boolean = false) =
        TaskWithTags(
            Task(id = title, title = title, description = "", scheduledTime = null, isDone = if (done) 1 else 0),
            emptyList(),
        )

    private fun titles(list: List<TaskWithTags>) = list.map { it.task.title }

    private val byTitle: Comparator<TaskWithTags> = compareBy { it.task.title }

    private fun TestScope.advance(ms: Long) {
        advanceTimeBy(ms)
        runCurrent()
    }

    /** Collects [flow] into a growing list on the background scope; returns a getter for the latest emission. */
    private fun TestScope.latestOf(flow: Flow<List<TaskWithTags>>): () -> List<TaskWithTags> {
        val seen = mutableListOf<List<TaskWithTags>>()
        backgroundScope.launch { flow.collect { seen += it } }
        runCurrent()
        return { seen.last() }
    }

    @Test
    fun `a completed task is held then auto-released after the grace window`() = runTest {
        val tracker = CompletionGraceTracker(backgroundScope, grace)

        tracker.markCompleted(task("a", done = true))
        runCurrent()
        assertEquals(setOf("a"), tracker.held.value.keys)

        advance(grace - 1)
        assertEquals("still held just before the window closes", setOf("a"), tracker.held.value.keys)

        advance(2)
        assertEquals("released after the window", emptySet<String>(), tracker.held.value.keys)
    }

    @Test
    fun `retain re-injects a held task that was in the list a moment ago`() = runTest {
        val tracker = CompletionGraceTracker(backgroundScope, grace)
        val source = MutableStateFlow(listOf(task("a"), task("b")))
        val latest = latestOf(tracker.retain(source, byTitle))

        assertEquals(listOf("a", "b"), titles(latest()))

        // Complete "b": hold it, then the query drops it (isDone=0 filter).
        tracker.markCompleted(task("b", done = true))
        source.value = listOf(task("a"))
        runCurrent()
        assertEquals("b stays in place during grace", listOf("a", "b"), titles(latest()))

        advance(grace + 10)
        assertEquals("b leaves once grace ends", listOf("a"), titles(latest()))
    }

    @Test
    fun `retain never injects a held task into a list it was not part of`() = runTest {
        val tracker = CompletionGraceTracker(backgroundScope, grace)
        val other = MutableStateFlow(listOf(task("x")))
        val latest = latestOf(tracker.retain(other, byTitle))

        tracker.markCompleted(task("y", done = true)) // completed somewhere else
        runCurrent()

        assertEquals(listOf("x"), titles(latest()))
    }

    @Test
    fun `suppressHeld hides a held task until it is released`() = runTest {
        val tracker = CompletionGraceTracker(backgroundScope, grace)
        val completed = MutableStateFlow(listOf(task("a", done = true)))
        val latest = latestOf(tracker.suppressHeld(completed))

        assertEquals(listOf("a"), titles(latest()))

        tracker.markCompleted(task("a", done = true))
        runCurrent()
        assertEquals("absent from the completed list during grace", emptyList<String>(), titles(latest()))

        advance(grace + 10)
        assertEquals("appears once grace ends", listOf("a"), titles(latest()))
    }

    @Test
    fun `release drops the hold immediately and cancels its timer`() = runTest {
        val tracker = CompletionGraceTracker(backgroundScope, grace)

        tracker.markCompleted(task("a", done = true))
        runCurrent()
        tracker.release("a")
        assertEquals(emptySet<String>(), tracker.held.value.keys)

        advance(grace + 10) // the cancelled timer must not resurrect / re-remove anything
        assertEquals(emptySet<String>(), tracker.held.value.keys)
    }

    @Test
    fun `rapid completions each get an independent timer`() = runTest {
        val tracker = CompletionGraceTracker(backgroundScope, grace)

        tracker.markCompleted(task("a", done = true))
        runCurrent()
        advance(200)
        tracker.markCompleted(task("b", done = true))
        runCurrent()

        advance(300) // a: 500ms elapsed (released), b: 300ms (still held)
        assertEquals(setOf("b"), tracker.held.value.keys)

        advance(200) // b: 500ms
        assertEquals(emptySet<String>(), tracker.held.value.keys)
    }

    @Test
    fun `re-marking the same id restarts its window`() = runTest {
        val tracker = CompletionGraceTracker(backgroundScope, grace)

        tracker.markCompleted(task("a", done = true))
        runCurrent()
        advance(400)
        tracker.markCompleted(task("a", done = true)) // restart
        runCurrent()

        advance(100) // 500ms since first mark, only 100ms since restart
        assertEquals(setOf("a"), tracker.held.value.keys)

        advance(grace)
        assertEquals(emptySet<String>(), tracker.held.value.keys)
    }
}
