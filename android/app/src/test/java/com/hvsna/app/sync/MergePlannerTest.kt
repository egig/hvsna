package com.hvsna.app.sync

import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class MergePlannerTest {
    private val now = 1_760_000_000_000L

    private fun rec(id: String, millis: Long, node: String, title: String = id, type: String = RecordType.TASK) =
        SyncRecord(type, id, Hlc(millis, 0, node).encode(), JsonObject(mapOf("title" to JsonPrimitive(title))))

    private fun file(device: String, vararg records: SyncRecord, formatVersion: Int = SyncCodec.CURRENT_FORMAT_VERSION, enc: String? = null) =
        SyncFile(formatVersion, device, "$device-name", now, enc, records.toList())

    @Test
    fun `newer remote records are applied and older ones are not`() {
        val local = listOf(rec("a", now - 10, "me", "local a"), rec("b", now - 10, "me", "local b"))
        val remote = file("peer", rec("a", now - 5, "peer", "remote a"), rec("b", now - 20, "peer", "remote b"), rec("c", now - 1, "peer"))
        val plan = MergePlanner.plan(local, listOf(remote), ownDeviceId = "me", now = now)
        assertEquals(listOf("task/a", "task/c"), plan.apply.map { it.key })
        assertEquals("remote a", (plan.apply[0].data["title"] as JsonPrimitive).content)
        assertTrue(plan.canUpload)
    }

    @Test
    fun `the newest of several peers wins`() {
        val plan = MergePlanner.plan(
            local = emptyList(),
            remotes = listOf(file("p1", rec("a", now - 9, "p1", "old")), file("p2", rec("a", now - 3, "p2", "new"))),
            ownDeviceId = "me",
            now = now,
        )
        assertEquals(listOf("new"), plan.apply.map { (it.data["title"] as JsonPrimitive).content })
    }

    @Test
    fun `same id under different types are separate records`() {
        val plan = MergePlanner.plan(
            local = listOf(rec("x", now - 1, "me", type = RecordType.TAG)),
            remotes = listOf(file("peer", rec("x", now - 9, "peer", type = RecordType.TASK))),
            ownDeviceId = "me",
            now = now,
        )
        assertEquals(listOf("task/x"), plan.apply.map { it.key })
    }

    @Test
    fun `own file is ignored`() {
        val plan = MergePlanner.plan(emptyList(), listOf(file("me", rec("a", now, "me"))), ownDeviceId = "me", now = now)
        assertTrue(plan.apply.isEmpty())
    }

    @Test
    fun `records from a clock far in the future and malformed stamps are skipped`() {
        val future = rec("a", now + MergePlanner.MAX_FUTURE_SKEW_MILLIS + 1, "peer")
        val nearFuture = rec("b", now + MergePlanner.MAX_FUTURE_SKEW_MILLIS, "peer")
        val malformed = SyncRecord(RecordType.TASK, "c", "not-an-hlc", JsonObject(emptyMap()))
        val plan = MergePlanner.plan(emptyList(), listOf(file("peer", future, nearFuture, malformed)), ownDeviceId = "me", now = now)
        assertEquals(listOf("task/b"), plan.apply.map { it.key })
        assertEquals(2, plan.skippedRecords)
    }

    @Test
    fun `a newer-format or encrypted peer blocks upload and is not read`() {
        val plan = MergePlanner.plan(
            local = emptyList(),
            remotes = listOf(
                file("newer", rec("a", now, "newer"), formatVersion = SyncCodec.CURRENT_FORMAT_VERSION + 1),
                file("locked", rec("b", now, "locked"), enc = "aes-256-gcm"),
            ),
            ownDeviceId = "me",
            now = now,
        )
        assertTrue(plan.apply.isEmpty())
        assertFalse(plan.canUpload)
        assertEquals(listOf("newer-name", "locked-name"), plan.blockingDevices)
    }

    @Test
    fun `codec round-trips a file`() {
        val original = file("peer", rec("a", now, "peer"))
        assertEquals(original, SyncCodec.decode(SyncCodec.encode(original)))
    }

    @Test
    fun `two devices converge after exchanging files`() {
        val a = listOf(rec("x", now - 5, "a", "a-x"), rec("y", now - 1, "a", "a-y"))
        val b = listOf(rec("x", now - 2, "b", "b-x"), rec("z", now - 3, "b", "b-z"))
        fun applied(local: List<SyncRecord>, remote: List<SyncRecord>, self: String, peer: String): Map<String, String> {
            val plan = MergePlanner.plan(local, listOf(file(peer, *remote.toTypedArray())), self, now)
            return (local.associateBy { it.key } + plan.apply.associateBy { it.key }).mapValues { it.value.hlc }
        }
        assertEquals(applied(a, b, "a", "b"), applied(b, a, "b", "a"))
    }
}
