package com.hvsna.app.sync

import org.junit.Assert.assertEquals
import org.junit.Test
import java.util.Random

class LwwMergeTest {
    private data class Rec(val id: String, val hlc: String, val value: String)

    private fun merge(a: Collection<Rec>, b: Collection<Rec>) = LwwMerge.merge(a, b, Rec::id, Rec::hlc)

    /** Random replicas over a small id space, with unique timestamps per device as a real clock guarantees. */
    private fun replica(random: Random, node: String): List<Rec> =
        (0 until random.nextInt(8)).map { i ->
            Rec(
                id = "r${random.nextInt(5)}",
                hlc = Hlc(random.nextInt(4).toLong(), i, node).encode(),
                value = "$node$i",
            )
        }.groupBy { it.id }.values.map { versions -> versions.maxBy { it.hlc } }

    @Test
    fun `newer timestamp wins and ties keep the current record`() {
        val old = Rec("x", Hlc(1, 0, "a").encode(), "old")
        val new = Rec("x", Hlc(2, 0, "a").encode(), "new")
        assertEquals(new, merge(listOf(old), listOf(new))["x"])
        assertEquals(new, merge(listOf(new), listOf(old))["x"])
        assertEquals(false, LwwMerge.wins(old.hlc, old.hlc))
    }

    @Test
    fun `merge is commutative, associative and idempotent`() {
        val random = Random(42)
        repeat(500) {
            val a = replica(random, "a")
            val b = replica(random, "b")
            val c = replica(random, "c")
            assertEquals(merge(a, b), merge(b, a))
            assertEquals(merge(merge(a, b).values, c), merge(a, merge(b, c).values))
            assertEquals(merge(a, b), merge(merge(a, b).values, b))
        }
    }
}
