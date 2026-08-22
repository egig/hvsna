package com.hvsna.app.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import com.hvsna.app.ui.AuthLogoutReason
import com.hvsna.app.ui.AuthViewModel

private val EMAIL_REGEX = Regex("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")
private const val MIN_PASSWORD_LENGTH = 8

/** Account section embedded in [com.hvsna.app.ui.screens.SettingsLoginScreen] — renders as sibling rows in the caller's Column. */
@Composable
fun ColumnScope.AuthAccountSection(viewModel: AuthViewModel) {
    val state by viewModel.state.collectAsState()

    Text("Account", style = MaterialTheme.typography.titleMedium)

    val user = state.user
    when {
        user != null -> {
            Text(
                if (user.firstName.isNotBlank()) "${user.firstName} ${user.lastName}".trim() else user.email,
                style = MaterialTheme.typography.bodyLarge,
            )
            Text(user.email, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Button(
                onClick = { viewModel.signOut() },
                enabled = !state.loading,
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text("Sign out")
            }
        }
        state.reconnecting -> ReconnectingSection(onRetry = { viewModel.retryConnection() })
        else -> {
            LogoutReasonBanner(state.logoutReason)
            SignedOutForm(viewModel = viewModel, loading = state.loading, error = state.error)
        }
    }
}

@Composable
private fun ColumnScope.ReconnectingSection(onRetry: () -> Unit) {
    Text(
        "Reconnecting to check your session…",
        style = MaterialTheme.typography.bodyMedium,
        color = MaterialTheme.colorScheme.onSurfaceVariant,
    )
    TextButton(onClick = onRetry, modifier = Modifier.fillMaxWidth()) {
        Text("Retry now")
    }
}

@Composable
private fun ColumnScope.LogoutReasonBanner(reason: AuthLogoutReason) {
    val message = when (reason) {
        AuthLogoutReason.SECURITY_REVOKED -> "You were signed out for your security — please sign in again."
        AuthLogoutReason.EXPIRED -> "Your session expired — please sign in again."
        AuthLogoutReason.NONE -> null
    } ?: return
    Text(message, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.error)
}

@Composable
private fun ColumnScope.SignedOutForm(viewModel: AuthViewModel, loading: Boolean, error: String?) {
    var isSignUp by rememberSaveable { mutableStateOf(false) }
    var email by rememberSaveable { mutableStateOf("") }
    var password by rememberSaveable { mutableStateOf("") }
    var firstName by rememberSaveable { mutableStateOf("") }
    var lastName by rememberSaveable { mutableStateOf("") }
    var validationError by remember { mutableStateOf<String?>(null) }

    fun submit() {
        validationError = when {
            !EMAIL_REGEX.matches(email) -> "Enter a valid email address"
            password.length < MIN_PASSWORD_LENGTH -> "Password must be at least $MIN_PASSWORD_LENGTH characters"
            else -> null
        }
        if (validationError != null) return
        viewModel.clearError()
        if (isSignUp) {
            viewModel.signUp(email.trim(), password, firstName.trim().ifBlank { null }, lastName.trim().ifBlank { null })
        } else {
            viewModel.signIn(email.trim(), password)
        }
    }

    Text(
        "Sign in to sync your tasks across devices.",
        style = MaterialTheme.typography.bodyMedium,
        color = MaterialTheme.colorScheme.onSurfaceVariant,
    )

    if (isSignUp) {
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            OutlinedTextField(
                value = firstName,
                onValueChange = { firstName = it },
                label = { Text("First name") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
            )
            OutlinedTextField(
                value = lastName,
                onValueChange = { lastName = it },
                label = { Text("Last name") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
            )
        }
    }

    OutlinedTextField(
        value = email,
        onValueChange = { email = it },
        label = { Text("Email") },
        singleLine = true,
        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
        modifier = Modifier.fillMaxWidth(),
    )

    OutlinedTextField(
        value = password,
        onValueChange = { password = it },
        label = { Text("Password") },
        singleLine = true,
        visualTransformation = PasswordVisualTransformation(),
        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
        modifier = Modifier.fillMaxWidth(),
    )

    (validationError ?: error)?.let {
        Text(it, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.error)
    }

    Button(
        onClick = { submit() },
        enabled = !loading,
        modifier = Modifier.fillMaxWidth(),
    ) {
        if (loading) {
            CircularProgressIndicator(
                modifier = Modifier.padding(end = 8.dp),
                strokeWidth = 2.dp,
                color = MaterialTheme.colorScheme.onPrimary,
            )
        }
        Text(if (isSignUp) "Create account" else "Sign in")
    }

    TextButton(
        onClick = {
            isSignUp = !isSignUp
            validationError = null
            viewModel.clearError()
        },
        modifier = Modifier.fillMaxWidth(),
    ) {
        Text(if (isSignUp) "Already have an account? Sign in" else "Need an account? Sign up")
    }
}
