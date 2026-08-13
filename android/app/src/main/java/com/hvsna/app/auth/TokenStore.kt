package com.hvsna.app.auth

/** In-memory holder for the short-lived access token — never persisted, re-derived from the refresh token on process start. */
class TokenStore {
    @Volatile
    private var accessToken: String? = null

    fun getAccessToken(): String? = accessToken

    fun setAccessToken(token: String) {
        accessToken = token
    }

    fun clearAccessToken() {
        accessToken = null
    }
}
