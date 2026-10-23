package com.hvsna.app.sync

import com.sun.net.httpserver.HttpServer
import kotlinx.coroutines.test.runTest
import okhttp3.HttpUrl.Companion.toHttpUrl
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Assert.fail
import org.junit.Before
import org.junit.Test
import java.io.IOException
import java.net.InetSocketAddress

/** Checks the HTTP requests [DriveClient] makes, against a local server standing in for Google Drive. */
class DriveClientTest {
    private data class Seen(val method: String, val path: String, val query: String?, val auth: String?, val contentType: String?, val body: ByteArray)

    private lateinit var server: HttpServer
    private val seen = mutableListOf<Seen>()
    private val responses = ArrayDeque<Pair<Int, String>>()

    @Before
    fun start() {
        server = HttpServer.create(InetSocketAddress("127.0.0.1", 0), 0)
        server.createContext("/") { ex ->
            seen += Seen(
                ex.requestMethod, ex.requestURI.path, ex.requestURI.rawQuery,
                ex.requestHeaders.getFirst("Authorization"), ex.requestHeaders.getFirst("Content-Type"),
                ex.requestBody.readBytes(),
            )
            val (code, body) = responses.removeFirstOrNull() ?: (200 to "{}")
            val bytes = body.toByteArray()
            ex.sendResponseHeaders(code, if (bytes.isEmpty()) -1 else bytes.size.toLong())
            if (bytes.isNotEmpty()) ex.responseBody.use { it.write(bytes) } else ex.close()
        }
        server.start()
    }

    @After
    fun stop() = server.stop(0)

    private var tokens = ArrayDeque(listOf("t1", "t2"))
    private val invalidated = mutableListOf<String>()

    private fun client() = DriveClient(
        accessToken = { tokens.first() },
        invalidateToken = { invalidated += it; tokens.removeFirst() },
        apiBase = "http://127.0.0.1:${server.address.port}/".toHttpUrl(),
    )

    @Test
    fun `list follows pages in the app data folder`() = runTest {
        responses += 200 to """{"files":[{"id":"1","name":"dev-a.json.gz","md5Checksum":"m1"}],"nextPageToken":"p2"}"""
        responses += 200 to """{"files":[{"id":"2","name":"dev-b.json.gz"}]}"""
        val files = client().list()
        assertEquals(listOf(RemoteFile("1", "dev-a.json.gz", "m1"), RemoteFile("2", "dev-b.json.gz", null)), files)
        assertEquals("/drive/v3/files", seen[0].path)
        assertTrue(seen[0].query!!.contains("spaces=appDataFolder"))
        assertTrue(seen[1].query!!.contains("pageToken=p2"))
        assertEquals("Bearer t1", seen[0].auth)
    }

    @Test
    fun `create sends multipart metadata with the app data folder parent, update patches media`() = runTest {
        responses += 200 to """{"id":"9","name":"dev-a.json.gz","md5Checksum":"m"}"""
        responses += 200 to """{"id":"9","name":"dev-a.json.gz","md5Checksum":"m2"}"""
        val c = client()
        assertEquals(RemoteFile("9", "dev-a.json.gz", "m"), c.create("dev-a.json.gz", byteArrayOf(1, 2, 3)))
        c.update("9", byteArrayOf(4))

        val create = seen[0]
        assertEquals("POST", create.method)
        assertEquals("/upload/drive/v3/files", create.path)
        assertTrue(create.query!!.contains("uploadType=multipart"))
        assertTrue(create.contentType!!.startsWith("multipart/related"))
        val body = create.body.toString(Charsets.ISO_8859_1)
        assertTrue(body.contains("""{"name":"dev-a.json.gz","parents":["appDataFolder"]}"""))
        assertTrue(body.contains("application/gzip"))

        val update = seen[1]
        assertEquals("PATCH", update.method)
        assertEquals("/upload/drive/v3/files/9", update.path)
        assertTrue(update.query!!.contains("uploadType=media"))
        assertEquals(listOf<Byte>(4), update.body.toList())
    }

    @Test
    fun `download asks for media`() = runTest {
        responses += 200 to "abc"
        assertEquals("abc", client().download("7").toString(Charsets.UTF_8))
        assertEquals("/drive/v3/files/7", seen[0].path)
        assertEquals("alt=media", seen[0].query)
    }

    @Test
    fun `a refused token is invalidated and retried once`() = runTest {
        responses += 401 to ""
        responses += 200 to """{"files":[]}"""
        client().list()
        assertEquals(listOf("t1"), invalidated)
        assertEquals("Bearer t2", seen[1].auth)
    }

    @Test
    fun `two refusals raise SyncAuthException`() = runTest {
        tokens = ArrayDeque(listOf("t1", "t2", "t3"))
        responses += 401 to ""
        responses += 401 to ""
        try { client().list(); fail() } catch (e: SyncAuthException) { }
    }

    @Test
    fun `status codes map to the engine's exceptions`() = runTest {
        responses += 404 to """{"error":{"code":404}}"""
        try { client().delete("x"); fail() } catch (e: SyncNotFoundException) { }
        responses += 403 to """{"error":{"errors":[{"reason":"insufficientPermissions"}]}}"""
        try { client().list(); fail() } catch (e: SyncAuthException) { }
        responses += 403 to """{"error":{"errors":[{"reason":"userRateLimitExceeded"}]}}"""
        try { client().list(); fail() } catch (e: IOException) { }
        responses += 503 to ""
        try { client().list(); fail() } catch (e: IOException) { }
    }
}
