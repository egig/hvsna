package com.hvsna.app.ui

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.hvsna.app.auth.ApiException
import com.hvsna.app.auth.AuthService
import com.hvsna.app.auth.AuthUser
import com.hvsna.app.auth.LogoutReason
import com.hvsna.app.auth.NoSessionException
import com.hvsna.app.auth.RefreshUnavailableException
import com.hvsna.app.auth.SessionExpiredException
import com.hvsna.app.auth.SessionRevokedException
import com.hvsna.app.sync.networkReconnectEvents
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

/** Why the sign-in form is showing, distinct from [AuthUiState.error] (a failed sign-in/sign-up attempt). */
enum class AuthLogoutReason { NONE, EXPIRED, SECURITY_REVOKED }

data class AuthUiState(
    val user: AuthUser? = null,
    val loading: Boolean = true,
    /** Couldn't confirm the session right now (offline/server unreachable) — NOT the same as logged out; the
     * stored refresh token is untouched. Shows a neutral "reconnecting" state instead of the sign-in form. */
    val reconnecting: Boolean = false,
    val error: String? = null,
    val logoutReason: AuthLogoutReason = AuthLogoutReason.NONE,
)

class AuthViewModel(
    private val authService: AuthService,
    private val context: Context,
) : ViewModel() {

    private val _state = MutableStateFlow(AuthUiState())
    val state: StateFlow<AuthUiState> = _state.asStateFlow()

    init {
        viewModelScope.launch { attemptRestore() }
        // Auto-retry the moment connectivity returns while we're stuck in "reconnecting" —
        // same signal SyncManager already uses for its own reconnect trigger.
        viewModelScope.launch {
            networkReconnectEvents(context).collect {
                if (_state.value.reconnecting) attemptRestore()
            }
        }
    }

    private suspend fun attemptRestore() {
        _state.value = _state.value.copy(loading = true, reconnecting = false)
        authService.initialize()
        if (!authService.isAuthenticated()) {
            finishAsLoggedOut()
            return
        }
        runCatching { authService.getCurrentUser() }
            .onSuccess { user -> _state.value = AuthUiState(user = user, loading = false) }
            .onFailure { error -> handleRestoreFailure(error) }
    }

    private suspend fun handleRestoreFailure(error: Throwable) {
        when (error) {
            is SessionExpiredException, is NoSessionException, is SessionRevokedException ->
                finishAsLoggedOut()
            // RefreshUnavailableException (couldn't reach the server), or any other failure out of
            // getCurrentUser() (e.g. a transient 5xx from /me) — the stored session is still intact,
            // we just couldn't confirm it. Don't show the sign-in form for this.
            else -> _state.value = _state.value.copy(loading = false, reconnecting = true)
        }
    }

    private suspend fun finishAsLoggedOut() {
        val reason = when (authService.consumeLogoutReason()) {
            LogoutReason.SECURITY_REVOKED -> AuthLogoutReason.SECURITY_REVOKED
            LogoutReason.EXPIRED -> AuthLogoutReason.EXPIRED
            LogoutReason.NONE -> AuthLogoutReason.NONE
        }
        _state.value = AuthUiState(loading = false, logoutReason = reason)
    }

    /** Manual retry for "reconnecting" — covers the case where the device is online but the server itself isn't reachable. */
    fun retryConnection() = viewModelScope.launch { attemptRestore() }

    fun signIn(email: String, password: String) = viewModelScope.launch {
        _state.value = _state.value.copy(loading = true, error = null)
        runCatching { authService.login(email, password) }
            .onSuccess { user -> _state.value = AuthUiState(user = user, loading = false) }
            .onFailure { error -> _state.value = _state.value.copy(loading = false, error = error.toUserMessage()) }
    }

    fun signUp(email: String, password: String, firstName: String?, lastName: String?) = viewModelScope.launch {
        _state.value = _state.value.copy(loading = true, error = null)
        runCatching { authService.register(email, password, firstName, lastName) }
            .onSuccess { user -> _state.value = AuthUiState(user = user, loading = false) }
            .onFailure { error -> _state.value = _state.value.copy(loading = false, error = error.toUserMessage()) }
    }

    fun signOut() = viewModelScope.launch {
        _state.value = _state.value.copy(loading = true)
        runCatching { authService.logout() }
        _state.value = AuthUiState(loading = false)
    }

    fun clearError() {
        _state.value = _state.value.copy(error = null)
    }

    private fun Throwable.toUserMessage(): String = when (this) {
        is ApiException -> message ?: "Something went wrong"
        else -> "Couldn't reach the server. Check your connection and try again."
    }

    class Factory(
        private val authService: AuthService,
        private val context: Context,
    ) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T =
            AuthViewModel(authService, context.applicationContext) as T
    }
}
