package com.hvsna.app.sync

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import okhttp3.HttpUrl
import okhttp3.HttpUrl.Companion.toHttpUrl
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.MultipartBody
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.Response
import java.io.IOException

/**
 * [RemoteStore] over the Google Drive REST API v3, confined to the app data
 * folder (scope `drive.appdata`): a hidden per-app folder in the user's
 * Drive that other apps and the Drive UI don't list.
 *
 * [accessToken] returns a current OAuth access token; [invalidateToken] is
 * called with a token the server refused, and the request is retried once
 * with a fresh one before failing with [SyncAuthException].
 */
class DriveClient(
    private val accessToken: suspend () -> String,
    private val invalidateToken: suspend (String) -> Unit,
    private val http: OkHttpClient = OkHttpClient(),
    private val apiBase: HttpUrl = "https://www.googleapis.com/".toHttpUrl(),
) : RemoteStore {
    private val json = Json { ignoreUnknownKeys = true }

    override suspend fun list(): List<RemoteFile> {
        val files = mutableListOf<RemoteFile>()
        var pageToken: String? = null
        do {
            val url = apiBase.newBuilder().addPathSegments("drive/v3/files")
                .addQueryParameter("spaces", APP_DATA_FOLDER)
                .addQueryParameter("q", "trashed = false")
                .addQueryParameter("fields", "nextPageToken,files($FILE_FIELDS)")
                .addQueryParameter("pageSize", "100")
                .apply { pageToken?.let { addQueryParameter("pageToken", it) } }
                .build()
            val page = json.decodeFromString(FileList.serializer(), execute { Request.Builder().url(url).get() }.utf8())
            files += page.files.map { it.toRemote() }
            pageToken = page.nextPageToken
        } while (pageToken != null)
        return files
    }

    override suspend fun download(id: String): ByteArray {
        val url = apiBase.newBuilder().addPathSegments("drive/v3/files").addPathSegment(id)
            .addQueryParameter("alt", "media").build()
        return execute { Request.Builder().url(url).get() }
    }

    override suspend fun create(name: String, bytes: ByteArray): RemoteFile {
        val metadata = JsonObject(
            mapOf("name" to JsonPrimitive(name), "parents" to JsonArray(listOf(JsonPrimitive(APP_DATA_FOLDER)))),
        ).toString()
        val body = MultipartBody.Builder().setType("multipart/related".toMediaType())
            .addPart(metadata.toRequestBody(JSON_TYPE))
            .addPart(bytes.toRequestBody(GZIP_TYPE))
            .build()
        val url = apiBase.newBuilder().addPathSegments("upload/drive/v3/files")
            .addQueryParameter("uploadType", "multipart")
            .addQueryParameter("fields", FILE_FIELDS).build()
        return parseFile(execute { Request.Builder().url(url).post(body) })
    }

    override suspend fun update(id: String, bytes: ByteArray): RemoteFile {
        val url = apiBase.newBuilder().addPathSegments("upload/drive/v3/files").addPathSegment(id)
            .addQueryParameter("uploadType", "media")
            .addQueryParameter("fields", FILE_FIELDS).build()
        return parseFile(execute { Request.Builder().url(url).patch(bytes.toRequestBody(GZIP_TYPE)) })
    }

    override suspend fun delete(id: String) {
        val url = apiBase.newBuilder().addPathSegments("drive/v3/files").addPathSegment(id).build()
        execute { Request.Builder().url(url).delete() }
    }

    private fun parseFile(bytes: ByteArray): RemoteFile = json.decodeFromString(DriveFile.serializer(), bytes.utf8()).toRemote()

    private suspend fun execute(build: () -> Request.Builder): ByteArray {
        val first = accessToken()
        call(build(), first)?.let { return it }
        invalidateToken(first)
        return call(build(), accessToken()) ?: throw SyncAuthException("Google Drive refused the access token")
    }

    /** Response body on success, null on 401; throws for anything else. */
    private suspend fun call(builder: Request.Builder, token: String): ByteArray? = withContext(Dispatchers.IO) {
        http.newCall(builder.header("Authorization", "Bearer $token").build()).execute().use { response ->
            when {
                response.isSuccessful -> response.body?.bytes() ?: ByteArray(0)
                response.code == 401 -> null
                else -> throw failure(response)
            }
        }
    }

    private fun failure(response: Response): Exception {
        val body = response.body?.string().orEmpty()
        val message = "Google Drive HTTP ${response.code}: ${body.take(300)}"
        return when {
            response.code == 404 -> SyncNotFoundException(message)
            // 403 also means "rate limited" (retryable); only a missing grant needs the user.
            response.code == 403 && ("insufficientPermissions" in body || "ACCESS_TOKEN_SCOPE_INSUFFICIENT" in body) ->
                SyncAuthException(message)
            else -> IOException(message)
        }
    }

    private fun ByteArray.utf8() = toString(Charsets.UTF_8)

    @Serializable
    private data class FileList(val files: List<DriveFile> = emptyList(), val nextPageToken: String? = null)

    @Serializable
    private data class DriveFile(val id: String, val name: String = "", val md5Checksum: String? = null) {
        fun toRemote() = RemoteFile(id, name, md5Checksum)
    }

    companion object {
        const val SCOPE = "https://www.googleapis.com/auth/drive.appdata"
        private const val APP_DATA_FOLDER = "appDataFolder"
        private const val FILE_FIELDS = "id,name,md5Checksum"
        private val JSON_TYPE = "application/json; charset=UTF-8".toMediaType()
        private val GZIP_TYPE = "application/gzip".toMediaType()
    }
}
