package com.hvsna.app.sync

/**
 * Last-writer-wins merge of record sets keyed by id, ordered by encoded
 * [Hlc] strings. Commutative, associative and idempotent, so merging device
 * files in any order, or the same file twice, converges on the same state.
 * Deletions are ordinary records (tombstones with `deletedAt` set), so they
 * win or lose like any other write.
 */
object LwwMerge {
    /** True when [incoming] should replace [current]. Equal timestamps keep [current]. */
    fun wins(incoming: String, current: String?): Boolean = current == null || incoming > current

    fun <T> merge(
        a: Collection<T>,
        b: Collection<T>,
        idOf: (T) -> String,
        hlcOf: (T) -> String,
    ): Map<String, T> {
        val out = HashMap<String, T>(a.size + b.size)
        for (record in a.asSequence() + b.asSequence()) {
            val id = idOf(record)
            val current = out[id]
            if (current == null || wins(hlcOf(record), hlcOf(current))) out[id] = record
        }
        return out
    }
}
