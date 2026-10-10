package com.hvsna.app.sync

/**
 * Hybrid logical clock timestamp: wall-clock millis, a counter that breaks
 * ties within the same millisecond (or while the wall clock lags behind an
 * already-issued timestamp), and the issuing device's id as the final
 * tiebreaker. Ordering is (physicalMillis, counter, nodeId).
 *
 * [encode] is fixed-width so the encoded strings sort lexicographically in
 * the same order as [compareTo]; the sync merge compares encoded strings
 * directly. Pure Kotlin on purpose — no Android imports — so it can move
 * into a shared sync module for the desktop client unchanged.
 */
data class Hlc(
    val physicalMillis: Long,
    val counter: Int,
    val nodeId: String,
) : Comparable<Hlc> {
    init {
        require(physicalMillis in 0..MAX_PHYSICAL) { "physicalMillis out of range: $physicalMillis" }
        require(counter in 0..MAX_COUNTER) { "counter out of range: $counter" }
        require(SEPARATOR !in nodeId) { "nodeId must not contain '$SEPARATOR'" }
    }

    override fun compareTo(other: Hlc): Int = encode().compareTo(other.encode())

    fun encode(): String =
        physicalMillis.toString().padStart(PHYSICAL_WIDTH, '0') + SEPARATOR +
            counter.toString(16).padStart(COUNTER_WIDTH, '0') + SEPARATOR +
            nodeId

    companion object {
        private const val SEPARATOR = '-'
        private const val PHYSICAL_WIDTH = 15
        private const val COUNTER_WIDTH = 4
        private const val MAX_PHYSICAL = 999_999_999_999_999L
        const val MAX_COUNTER = 0xFFFF

        fun parse(encoded: String): Hlc {
            val parts = encoded.split(SEPARATOR, limit = 3)
            require(parts.size == 3 && parts[0].length == PHYSICAL_WIDTH && parts[1].length == COUNTER_WIDTH) {
                "Malformed HLC: $encoded"
            }
            return Hlc(parts[0].toLong(), parts[1].toInt(16), parts[2])
        }

        fun parseOrNull(encoded: String): Hlc? = runCatching { parse(encoded) }.getOrNull()

        /**
         * The timestamp a record is merged by. Rows written before HLC
         * stamping existed have an empty [hlc]; they fall back to their
         * `updatedAt` with counter 0 and an empty node id, which orders below
         * any stamped write made in the same millisecond.
         */
        fun effective(hlc: String, updatedAt: Long): String =
            hlc.ifEmpty { Hlc(updatedAt.coerceIn(0, MAX_PHYSICAL), 0, "").encode() }
    }
}

/**
 * Issues [Hlc] timestamps for one device. Thread-safe; one instance per
 * process (see `SyncClock`), since two clocks with the same node id could
 * issue the same timestamp.
 */
class HlcClock(
    private val nodeId: String,
    private val wallClock: () -> Long = System::currentTimeMillis,
) {
    private var last = Hlc(0, 0, nodeId)

    /**
     * A timestamp for a local write. Strictly greater than every timestamp
     * this clock issued or received before, and than [after] (the written
     * record's previous timestamp, if any) — so a record's own history is
     * monotonic even if the wall clock jumped backwards since the app last
     * ran.
     */
    @Synchronized
    fun next(after: String? = null): String {
        after?.let(Hlc::parseOrNull)?.let(::observe)
        val now = wallClock()
        last = if (now > last.physicalMillis) {
            Hlc(now, 0, nodeId)
        } else {
            advance(last.physicalMillis, last.counter)
        }
        return last.encode()
    }

    /**
     * Folds in a timestamp seen on a record from another device, so later
     * local writes order after it. Call for every remote record applied
     * during a sync merge. A malformed value is ignored.
     */
    @Synchronized
    fun receive(remote: String) {
        Hlc.parseOrNull(remote)?.let(::observe)
    }

    private fun observe(seen: Hlc) {
        if (seen.physicalMillis > last.physicalMillis ||
            (seen.physicalMillis == last.physicalMillis && seen.counter > last.counter)
        ) {
            last = Hlc(seen.physicalMillis, seen.counter, nodeId)
        }
    }

    private fun advance(physicalMillis: Long, counter: Int): Hlc =
        if (counter < Hlc.MAX_COUNTER) Hlc(physicalMillis, counter + 1, nodeId) else Hlc(physicalMillis + 1, 0, nodeId)
}
