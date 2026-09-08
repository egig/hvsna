package com.hvsna.app.ui

import com.hvsna.app.data.TaskWithTags
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.drop
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.scan
import kotlinx.coroutines.launch

/** How long a just-completed task lingers in its origin list before it animates out. */
const val COMPLETION_GRACE_MS = 450L

/**
 * Keeps a just-completed task visible in its origin list for a short "grace" window, so the
 * checkbox tick and strike-through register in place before the row animates away — instead
 * of the row vanishing the instant `isDone` flips to 1.
 *
 * The task is persisted (`isDone = 1`) immediately by the caller; this only defers the
 * *visual* removal from the pending lists. It is deliberately free of Android / Compose
 * dependencies so the state machine can be unit-tested with `runTest`. [TaskViewModel] owns
 * a single instance bound to its `viewModelScope`; nothing here needs to survive process
 * death (the DB is always the source of truth).
 */
class CompletionGraceTracker(
    private val scope: CoroutineScope,
    private val graceMs: Long = COMPLETION_GRACE_MS,
) {
    private val _held = MutableStateFlow<Map<String, TaskWithTags>>(emptyMap())

    /** Tasks currently being held in their origin list, keyed by (real / materialized) task id. */
    val held: StateFlow<Map<String, TaskWithTags>> = _held.asStateFlow()

    private val timers = mutableMapOf<String, Job>()

    /**
     * Start holding [snapshot] (already flagged `isDone = 1`, tags included) in whichever
     * pending list it currently belongs to. Auto-releases after [graceMs]. Each id gets its
     * own timer, so checking several tasks in quick succession doesn't reset one another.
     */
    fun markCompleted(snapshot: TaskWithTags) {
        val id = snapshot.task.id
        timers.remove(id)?.cancel()
        _held.value = _held.value + (id to snapshot)
        timers[id] = scope.launch {
            delay(graceMs)
            timers.remove(id)
            _held.value = _held.value - id
        }
    }

    /**
     * Drop [id] from the hold right now — the user tapped Undo, or re-toggled the row before
     * the grace window elapsed. Safe to call for an id that isn't held.
     */
    fun release(id: String) {
        timers.remove(id)?.cancel()
        if (_held.value.containsKey(id)) _held.value = _held.value - id
    }

    /**
     * Re-injects held tasks into [source], but only those that were present in [source]'s
     * previous emission — so a task completed in one list never leaks into an unrelated list
     * (e.g. completing on Today must not make the row appear in Search). Re-injected rows are
     * merged back in order via [comparator].
     */
    fun retain(
        source: Flow<List<TaskWithTags>>,
        comparator: Comparator<TaskWithTags>,
    ): Flow<List<TaskWithTags>> =
        source.combine(held) { rows, heldMap -> rows to heldMap }
            .scan(RetainState()) { prev, (rows, heldMap) ->
                val rowIds = rows.mapTo(HashSet()) { it.task.id }
                val reinjected = heldMap.values.filter {
                    it.task.id !in rowIds && it.task.id in prev.knownIds
                }
                val emitted =
                    if (reinjected.isEmpty()) rows
                    else (rows + reinjected).sortedWith(comparator)
                reinjected.forEach { rowIds.add(it.task.id) }
                RetainState(emitted, rowIds)
            }
            .drop(1) // the seed
            .map { it.emitted }

    /**
     * Hides held tasks from [source] — used for the completed-side flows so a task appears
     * there only once it has finished leaving its origin list.
     */
    fun suppressHeld(source: Flow<List<TaskWithTags>>): Flow<List<TaskWithTags>> =
        source.combine(held) { rows, heldMap ->
            if (heldMap.isEmpty()) rows else rows.filter { it.task.id !in heldMap }
        }

    private data class RetainState(
        val emitted: List<TaskWithTags> = emptyList(),
        val knownIds: Set<String> = emptySet(),
    )
}
