package com.hvsna.app.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.hvsna.app.auth.ApiException
import com.hvsna.app.auth.AuthService
import com.hvsna.app.auth.AuthUser
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class AuthUiState(
    val user: AuthUser? = null,
    val loading: Boolean = true,
    val error: String? = null,
)

class AuthViewModel(private val authService: AuthService) : ViewModel() {

    private val _state = MutableStateFlow(AuthUiState())
    val state: StateFlow<AuthUiState> = _state.asStateFlow()

    init {
        viewModelScope.launch {
            authService.initialize()
            if (authService.isAuthenticated()) {
                runCatching { authService.getCurrentUser() }
                    .onSuccess { user -> _state.value = AuthUiState(user = user, loading = false) }
                    .onFailure { _state.value = AuthUiState(loading = false) }
            } else {
                _state.value = AuthUiState(loading = false)
            }
        }
    }

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

    class Factory(private val authService: AuthService) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T = AuthViewModel(authService) as T
    }
}
