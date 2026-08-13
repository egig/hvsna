package com.hvsna.app.auth

import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock

class NoSessionException : Exception("No active session")
class SessionExpiredException : Exception("Session has expired")

/** Mirrors packages/app's infra/auth/AuthService.ts against the same packages/api endpoints. */
class AuthService(
    private val api: AuthApi,
    private val tokenStore: TokenStore,
    private val sessionRepo: SessionRepository,
) {
    private val refreshMutex = Mutex()
    private var inFlightRefresh: CompletableDeferred<Session>? = null

    suspend fun login(email: String, password: String): AuthUser {
        val session = api.login(email, password)
        applySession(session)
        return api.me(session.access_token)
    }

    suspend fun register(
        email: String,
        password: String,
        firstName: String? = null,
        lastName: String? = null,
    ): AuthUser {
        val session = api.register(email, password, firstName, lastName)
        applySession(session)
        return api.me(session.access_token)
    }

    suspend fun logout() {
        val refreshToken = sessionRepo.getRefreshToken()
        if (refreshToken != null) {
            runCatching { api.logout(refreshToken) }
        }
        tokenStore.clearAccessToken()
        sessionRepo.clearRefreshToken()
    }

    /** Dedupes concurrent refreshes into a single in-flight request, like the web client's refreshPromise. */
    suspend fun refreshSession(): Session {
        val (deferred, isOwner) = refreshMutex.withLock {
            val existing = inFlightRefresh
            if (existing != null) return@withLock existing to false
            val created = CompletableDeferred<Session>()
            inFlightRefresh = created
            created to true
        }
        if (!isOwner) return deferred.await()

        try {
            val session = doRefresh()
            deferred.complete(session)
            return session
        } catch (error: Throwable) {
            deferred.completeExceptionally(error)
            throw error
        } finally {
            refreshMutex.withLock { inFlightRefresh = null }
        }
    }

    private suspend fun doRefresh(): Session {
        val refreshToken = sessionRepo.getRefreshToken() ?: throw NoSessionException()
        try {
            val session = api.refresh(refreshToken)
            applySession(session)
            return session
        } catch (error: Exception) {
            tokenStore.clearAccessToken()
            sessionRepo.clearRefreshToken()
            throw SessionExpiredException()
        }
    }

    /** Fetches the current user, transparently refreshing once and retrying if the access token expired. */
    suspend fun getCurrentUser(): AuthUser {
        val accessToken = tokenStore.getAccessToken() ?: refreshSession().access_token
        return try {
            api.me(accessToken)
        } catch (error: ApiException) {
            if (!error.isTokenExpired) throw error
            api.me(refreshSession().access_token)
        }
    }

    suspend fun isAuthenticated(): Boolean =
        tokenStore.getAccessToken() != null && sessionRepo.getRefreshToken() != null

    /** Call once at app startup to restore a session from the persisted refresh token. */
    suspend fun initialize() {
        val refreshToken = sessionRepo.getRefreshToken() ?: return
        if (tokenStore.getAccessToken() != null) return
        try {
            refreshSession()
        } catch (_: Exception) {
            sessionRepo.clearRefreshToken()
        }
    }

    private suspend fun applySession(session: Session) {
        tokenStore.setAccessToken(session.access_token)
        sessionRepo.saveRefreshToken(session.refresh_token)
    }
}
