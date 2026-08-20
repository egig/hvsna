package com.hvsna.app.auth

import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock

class NoSessionException : Exception("No active session")
class SessionExpiredException : Exception("Session has expired")

/**
 * Thrown when /auth/refresh could not be reached or answered (network
 * error, timeout, 5xx) as opposed to the server explicitly rejecting the
 * refresh token. Callers must NOT clear the stored refresh token on this
 * error — the session may still be valid, just unreachable right now.
 */
class RefreshUnavailableException : Exception("Could not reach the server to refresh the session")

/**
 * AuthService is constructed fresh per call site (Activity/ViewModel,
 * SyncWorker, receivers — see SyncWorker's doc comment) rather than shared
 * as a singleton, since WorkManager's default worker instantiation can't
 * reach an Activity-owned instance anyway. All of those instances still
 * read/write the same persisted, rotate-on-use refresh token via
 * SessionRepository though, so two of them refreshing around the same time
 * (e.g. periodic SyncWorker firing while the foreground app also needs a
 * new access token) race to redeem the same token — the loser gets
 * rejected by the server even though the winner's rotation just succeeded.
 * This process-wide lock serializes the actual refresh critical section
 * across every AuthService instance so a loser blocks and then re-reads
 * the already-rotated token instead of racing on a stale copy.
 */
private object RefreshCoordinator {
    val mutex = Mutex()
}

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
            val session = RefreshCoordinator.mutex.withLock { doRefresh() }
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
        // Re-read inside the process-wide lock: another AuthService instance
        // may have already rotated this token while we were waiting our turn.
        val refreshToken = sessionRepo.getRefreshToken() ?: throw NoSessionException()
        try {
            val session = api.refresh(refreshToken)
            applySession(session)
            return session
        } catch (error: ApiException) {
            if (error.status == 401) {
                tokenStore.clearAccessToken()
                sessionRepo.clearRefreshToken()
                throw SessionExpiredException()
            }
            throw RefreshUnavailableException()
        } catch (error: Exception) {
            // Network error, timeout, or similar reaching /auth/refresh — the
            // token itself hasn't been rejected, so don't destroy the session.
            throw RefreshUnavailableException()
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
        } catch (error: Exception) {
            // Only drop the stored refresh token when the server actually
            // rejected it. RefreshUnavailableException means we simply
            // couldn't reach the server right now (offline, timeout) — leave
            // the token in place so a later retry can still restore the
            // session.
            if (error is SessionExpiredException || error is NoSessionException) {
                sessionRepo.clearRefreshToken()
            }
        }
    }

    private suspend fun applySession(session: Session) {
        tokenStore.setAccessToken(session.access_token)
        sessionRepo.saveRefreshToken(session.refresh_token)
    }
}
