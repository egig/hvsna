package com.hvsna.app.data

/** Orders by scheduledTime ascending then id ascending, treating a null scheduledTime as smallest (matches [compareValues]'s null-first behavior). */
val leadOccurrenceOrder: Comparator<Task> = Comparator { a, b ->
    val byTime = compareValues(a.scheduledTime, b.scheduledTime)
    if (byTime != 0) byTime else a.id.compareTo(b.id)
}

/**
 * getUpcoming/getBrowse/search each need to collapse a recurring series
 * down to its single earliest-pending occurrence, so a series with several
 * materialized-but-undone rows only ever shows one. ObjectBox has no
 * correlated-subquery equivalent for that, so this does the reduction in
 * Kotlin instead.
 *
 * [undoneCandidates] must be the *whole* isDone=false && deletedAt=null set
 * — not pre-filtered by a time range or search text — because "earliest
 * occurrence" has to be computed over that whole scope regardless of
 * whatever extra filter a caller applies. Callers apply their own filter
 * (time range, text match) before or after calling this; AND is
 * commutative, so order doesn't matter as long as this function itself
 * always sees the full undone/non-deleted universe.
 *
 * Non-recurring tasks (`recurringTaskId == null`) pass through untouched.
 * Ties on `scheduledTime` (including both null, which sorts first) break on
 * `id` ascending.
 */
fun collapseToLeadOccurrencePerSeries(undoneCandidates: List<Task>): List<Task> {
    val leadIdBySeries: Map<String, String> = undoneCandidates
        .filter { it.recurringTaskId != null }
        .groupBy { it.recurringTaskId!! }
        .mapValues { (_, tasks) ->
            tasks.minWith(leadOccurrenceOrder).id
        }
    return undoneCandidates.filter { task ->
        task.recurringTaskId == null || task.id == leadIdBySeries[task.recurringTaskId]
    }
}
