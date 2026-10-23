package com.hvsna.app.sync

import kotlinx.coroutines.test.runTest
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import java.security.MessageDigest

class SyncEngineTest {
    private val now = 1_760_000_000_000L

    /** In-memory Drive app folder. */
    private class FakeRemote : RemoteStore {
        val files = linkedMapOf<String, Pair<String, ByteArray>>()
        var nextId = 0
        var downloads = 0
        var failDownloads = false
        var authFails = false

        private fun md5(bytes: ByteArray) = MessageDigest.getInstance("MD5").digest(bytes).joinToString("") { "%02x".format(it) }
        private fun check() { if (authFails) throw SyncAuthException("401") }

        override suspend fun list() = files.map { (id, f) -> RemoteFile(id, f.first, md5(f.second)) }.also { check() }
        override suspend fun download(id: String): ByteArray {
            check(); downloads++
            if (failDownloads) throw java.io.IOException("offline")
            return files.getValue(id).second
        }
        override suspend fun create(name: String, bytes: ByteArray): RemoteFile {
            check(); val id = "f${nextId++}"; files[id] = name to bytes; return RemoteFile(id, name, md5(bytes))
        }
        override suspend fun update(id: String, bytes: ByteArray): RemoteFile {
            check(); val name = files[id]?.first ?: throw SyncNotFoundException(id); files[id] = name to bytes; return RemoteFile(id, name, md5(bytes))
        }
        override suspend fun delete(id: String) { check(); files.remove(id) ?: throw SyncNotFoundException(id) }
    }

    /** A device's rows: key -> record. */
    private class FakeLocal(private val node: String) : LocalRecords {
        val rows = linkedMapOf<String, SyncRecord>()
        var tick = 0L
        fun edit(id: String, title: String, at: Long) {
            val r = SyncRecord(RecordType.TASK, id, Hlc(at, (tick++).toInt(), node).encode(), JsonObject(mapOf("title" to JsonPrimitive(title))))
            rows[r.key] = r
        }
        fun title(id: String) = (rows["task/$id"]?.data?.get("title") as? JsonPrimitive)?.content
        override fun snapshot() = rows.values.toList()
        override fun apply(records: List<SyncRecord>): Set<String> {
            records.forEach { rows[it.key] = it }
            return records.filter { it.type == RecordType.TASK }.map { it.id }.toSet()
        }
    }

    private class Book : SyncBookkeeping {
        override var uploadedDigest: String? = null
        override var mergedChecksums: Map<String, String> = emptyMap()
        override var ownFileId: String? = null
    }

    private fun engine(remote: RemoteStore, local: LocalRecords, id: String, book: SyncBookkeeping = Book()) =
        SyncEngine(remote, local, book, id, "$id-phone", now = { now })

    @Test
    fun `two devices converge through the shared folder`() = runTest {
        val remote = FakeRemote()
        val a = FakeLocal("a").apply { edit("1", "a one", now - 100); edit("2", "a two", now - 50) }
        val b = FakeLocal("b").apply { edit("1", "b one", now - 10); edit("3", "b three", now - 20) }
        val ea = engine(remote, a, "a")
        val eb = engine(remote, b, "b")

        ea.run(); eb.run(); ea.run()

        assertEquals(a.rows, b.rows)
        assertEquals("b one", a.title("1"))
        assertEquals(setOf("dev-a.json.gz", "dev-b.json.gz"), remote.files.values.map { it.first }.toSet())
    }

    @Test
    fun `an unchanged state is not uploaded again and unchanged peers are not downloaded again`() = runTest {
        val remote = FakeRemote()
        val a = FakeLocal("a").apply { edit("1", "x", now) }
        val b = FakeLocal("b").apply { edit("2", "y", now) }
        val ea = engine(remote, a, "a")
        engine(remote, b, "b").run()

        val first = ea.run() as SyncOutcome.Synced
        assertTrue(first.uploaded)
        assertEquals(1, remote.downloads)

        val second = ea.run() as SyncOutcome.Synced
        assertFalse(second.uploaded)
        assertEquals(0, second.appliedRecords)
        assertEquals(1, remote.downloads)

        a.edit("1", "x2", now + 1)
        assertTrue((ea.run() as SyncOutcome.Synced).uploaded)
    }

    @Test
    fun `own file deleted remotely is uploaded again`() = runTest {
        val remote = FakeRemote()
        val a = FakeLocal("a").apply { edit("1", "x", now) }
        val ea = engine(remote, a, "a")
        ea.run()
        remote.files.clear()
        assertTrue((ea.run() as SyncOutcome.Synced).uploaded)
        assertEquals(listOf("dev-a.json.gz"), remote.files.values.map { it.first })
    }

    @Test
    fun `duplicate own files are collapsed to one`() = runTest {
        val remote = FakeRemote()
        val a = FakeLocal("a").apply { edit("1", "x", now) }
        remote.create("dev-a.json.gz", ByteArray(0))
        remote.create("dev-a.json.gz", ByteArray(0))
        engine(remote, a, "a").run()
        assertEquals(1, remote.files.values.count { it.first == "dev-a.json.gz" })
    }

    @Test
    fun `a newer-format peer blocks uploading and is read again later`() = runTest {
        val remote = FakeRemote()
        val newer = SyncFile(SyncCodec.CURRENT_FORMAT_VERSION + 1, "n", "Tablet", now, null, emptyList())
        remote.create("dev-n.json.gz", SyncCodec.encode(newer))
        val a = FakeLocal("a").apply { edit("1", "x", now) }
        val ea = engine(remote, a, "a")

        val outcome = ea.run() as SyncOutcome.Synced
        assertFalse(outcome.uploaded)
        assertEquals(listOf("Tablet"), outcome.blockingDevices)
        ea.run()
        assertEquals(2, remote.downloads)
    }

    @Test
    fun `a corrupt peer file is skipped without failing the cycle`() = runTest {
        val remote = FakeRemote()
        remote.create("dev-x.json.gz", "not gzip".toByteArray())
        val a = FakeLocal("a").apply { edit("1", "x", now) }
        assertTrue((engine(remote, a, "a").run() as SyncOutcome.Synced).uploaded)
    }

    @Test
    fun `a download error fails the cycle and nothing is marked merged`() = runTest {
        val remote = FakeRemote()
        val b = FakeLocal("b").apply { edit("2", "y", now) }
        engine(remote, b, "b").run()
        val book = Book()
        val ea = engine(remote, FakeLocal("a"), "a", book)
        remote.failDownloads = true
        assertTrue(ea.run() is SyncOutcome.Failed)
        assertTrue(book.mergedChecksums.isEmpty())
        remote.failDownloads = false
        assertEquals(1, (ea.run() as SyncOutcome.Synced).appliedRecords)
    }

    @Test
    fun `refused credentials ask for authorization`() = runTest {
        val remote = FakeRemote().apply { authFails = true }
        assertEquals(SyncOutcome.NeedsAuthorization, engine(remote, FakeLocal("a"), "a").run())
    }

    @Test
    fun `deleteRemoteData removes every device file and resets bookkeeping`() = runTest {
        val remote = FakeRemote()
        val book = Book()
        engine(remote, FakeLocal("b").apply { edit("2", "y", now) }, "b").run()
        val ea = engine(remote, FakeLocal("a").apply { edit("1", "x", now) }, "a", book)
        ea.run()
        ea.deleteRemoteData()
        assertTrue(remote.files.isEmpty())
        assertEquals(null, book.uploadedDigest)
        assertEquals(null, book.ownFileId)
    }
}
