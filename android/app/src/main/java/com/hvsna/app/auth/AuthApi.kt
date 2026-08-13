package com.hvsna.app.auth

import com.hvsna.app.BuildConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.decodeFromJsonElement
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody

private val JSON_MEDIA_TYPE = "application/json".toMediaType()

@Serializable
private data class LoginRequest(val email: String, val password: String)

@Serializable
private data class RegisterRequest(
    val email: String,
    val password: String,
    val firstName: String? = null,
    val lastName: String? = null,
)

@Serializable
private data class RefreshRequest(val refresh_token: String)

/** Raw HTTP calls against packages/api's auth resource routes — no token handling, that's [AuthService]. */
class AuthApi(private val httpClient: OkHttpClient) {
    private val json = Json { ignoreUnknownKeys = true }
    private val baseUrl = BuildConfig.API_BASE_URL

    suspend fun login(email: String, password: String): Session {
        val body = json.encodeToString(LoginRequest.serializer(), LoginRequest(email, password))
        return decodeData(postRaw("/login", body))
    }

    suspend fun register(
        email: String,
        password: String,
        firstName: String? = null,
        lastName: String? = null,
    ): Session {
        val body = json.encodeToString(
            RegisterRequest.serializer(),
            RegisterRequest(email, password, firstName, lastName),
        )
        return decodeData(postRaw("/register", body))
    }

    suspend fun refresh(refreshToken: String): Session {
        val body = json.encodeToString(RefreshRequest.serializer(), RefreshRequest(refreshToken))
        return decodeData(postRaw("/auth/refresh", body))
    }

    suspend fun logout(refreshToken: String) {
        val body = json.encodeToString(RefreshRequest.serializer(), RefreshRequest(refreshToken))
        postRaw("/auth/logout", body)
    }

    suspend fun me(accessToken: String): AuthUser = withContext(Dispatchers.IO) {
        val request = Request.Builder()
            .url("$baseUrl/me")
            .header("Authorization", "Bearer $accessToken")
            .get()
            .build()
        decodeData(execute(request))
    }

    private suspend fun postRaw(path: String, bodyJson: String): JsonElement = withContext(Dispatchers.IO) {
        val request = Request.Builder()
            .url("$baseUrl$path")
            .post(bodyJson.toRequestBody(JSON_MEDIA_TYPE))
            .build()
        execute(request)
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
