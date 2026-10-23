package com.hvsna.app.sync

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class HlcTest {
    @Test
    fun `encode round-trips through parse`() {
        val hlc = Hlc(1_760_000_000_123, 0x2a, "abc123")
        assertEquals(hlc, Hlc.parse(hlc.encode()))
    }

    @Test
    fun `encoded strings sort like the timestamps they encode`() {
        val ordered = listOf(
            Hlc(999, 0xffff, "z"),
            Hlc(1_000, 0, ""),
            Hlc(1_000, 0, "a"),
            Hlc(1_000, 1, "a"),
            Hlc(1_000, 0x10, "a"),
            Hlc(1_760_000_000_000, 0, "a"),
        )
        assertEquals(ordered.map { it.encode() }, ordered.map { it.encode() }.shuffled(java.util.Random(7)).sorted())
    }

    @Test
    fun `effective falls back to updatedAt below any stamped write in the same millisecond`() {
        val legacy = Hlc.effective("", updatedAt = 5_000)
        assertTrue(legacy < Hlc(5_000, 0, "a").encode())
        assertTrue(legacy > Hlc(4_999, 0xffff, "z").encode())
        assertEquals("x", Hlc.effective("x", updatedAt = 5_000))
    }

    @Test
    fun `clock is strictly increasing when the wall clock stalls or goes backwards`() {
        var now = 10_000L
        val clock = HlcClock("n", wallClock = { now })
        val a = clock.next()
        val b = clock.next()
        now = 9_000
        val c = clock.next()
        now = 10_001
        val d = clock.next()
        assertTrue(a < b && b < c && c < d)
        assertEquals(Hlc(10_000, 2, "n"), Hlc.parse(c))
        assertEquals(Hlc(10_001, 0, "n"), Hlc.parse(d))
    }

    @Test
    fun `next orders after the record's previous timestamp from a faster clock`() {
        val clock = HlcClock("n", wallClock = { 1_000L })
        val previous = Hlc(50_000, 3, "other").encode()
        val stamped = clock.next(after = previous)
        assertTrue(stamped > previous)
        assertEquals(Hlc(50_000, 4, "n"), Hlc.parse(stamped))
    }

    @Test
    fun `receive makes later local writes order after the remote timestamp`() {
        val clock = HlcClock("a", wallClock = { 1_000L })
        val remote = Hlc(2_000, 7, "b").encode()
        clock.receive(remote)
        assertTrue(clock.next() > remote)
    }

    @Test
    fun `malformed timestamps are ignored rather than thrown`() {
        val clock = HlcClock("a", wallClock = { 1_000L })
        clock.receive("garbage")
        assertEquals(Hlc(1_000, 0, "a"), Hlc.parse(clock.next(after = "also-garbage")))
    }

    @Test
    fun `counter overflow carries into the physical part`() {
        val clock = HlcClock("a", wallClock = { 1_000L })
        clock.receive(Hlc(1_000, Hlc.MAX_COUNTER, "b").encode())
        assertEquals(Hlc(1_001, 0, "a"), Hlc.parse(clock.next()))
    }
}
