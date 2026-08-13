package com.hvsna.app.sync

import com.hvsna.app.BuildConfig
import com.hvsna.app.auth.ApiException
import com.hvsna.app.auth.AuthService
import com.hvsna.app.auth.TokenStore
import com.hvsna.app.auth.isTokenExpired
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.decodeFromJsonElement
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import okhttp3.HttpUrl
import okhttp3.HttpUrl.Companion.toHttpUrl
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody

private val JSON_MEDIA_TYPE = "application/json".toMediaType()

/**
 * Raw HTTP calls against packages/api's /sync/push and /sync/pull — the
 * same Bearer-auth pattern as AuthApi, plus a refresh-and-retry-once wrapper
 * (mirrors AuthService.getCurrentUser's TOKEN_EXPIRED handling) since these
 * routes require an access token AuthApi's own calls don't need.
 */
class SyncApi(
    private val httpClient: OkHttpClient,
    private val authService: AuthService,
    private val tokenStore: TokenStore,
) {
    private val json = Json { ignoreUnknownKeys = true }
    private val baseUrl = BuildConfig.API_BASE_URL

    suspend fun push(request: SyncPushRequest): SyncPushResponse {
        val body = json.encodeToString(SyncPushRequest.serializer(), request)
        return decodeData(authedRequest(method = "POST", path = "/sync/push", bodyJson = body))
    }

    suspend fun pull(cursors: SyncPullCursors, limit: Int): SyncPullResponse {
        val url = "$baseUrl/sync/pull".toHttpUrl().newBuilder()
            .addQueryParameter("tasks_cursor", cursors.tasks.toString())
            .addQueryParameter("recurring_tasks_cursor", cursors.recurringTasks.toString())
            .addQueryParameter("settings_cursor", cursors.settings.toString())
            .addQueryParameter("tags_cursor", cursors.tags.toString())
            .addQueryParameter("limit", limit.toString())
            .build()
        return decodeData(authedRequest(method = "GET", url = url))
    }

    private suspend fun authedRequest(
        method: String,
        path: String? = null,
        url: HttpUrl? = null,
        bodyJson: String? = null,
    ): JsonElement = withContext(Dispatchers.IO) {
        val resolvedUrl = url ?: "$baseUrl$path".toHttpUrl()
        val accessToken = tokenStore.getAccessToken() ?: authService.refreshSession().access_token
        try {
            execute(buildRequest(method, resolvedUrl, bodyJson, accessToken))
        } catch (error: ApiException) {
            if (!error.isTokenExpired) throw error
            val refreshed = authService.refreshSession().access_token
            execute(buildRequest(method, resolvedUrl, bodyJson, refreshed))
        }
    }

    private fun buildRequest(method: String, url: HttpUrl, bodyJson: String?, accessToken: String): Request {
        val builder = Request.Builder().url(url).header("Authorization", "Bearer $accessToken")
        return when (method) {
            "POST" -> builder.post((bodyJson ?: "{}").toRequestBody(JSON_MEDIA_TYPE))
            else -> builder.get()
        }.build()
    }

    private fun execute(request: Request): JsonElement {
        httpClient.newCall(request).execute().use { response ->
            val bodyString = response.body?.string().orEmpty()
            val root: JsonObject = json.parseToJsonElement(bodyString.ifEmpty { "{}" }).jsonObject
            if (!response.isSuccessful) {
                val code = root["code"]?.jsonPrimitive?.content ?: "UNKNOWN_ERROR"
                val message = root["message"]?.jsonPrimitive?.content ?: "Request failed"
                throw ApiException(response.code, code, message)
            }
            return root["data"] ?: JsonObject(emptyMap())
        }
    }

    private inline fun <reified T> decodeData(element: JsonElement): T = json.decodeFromJsonElement(element)
}
