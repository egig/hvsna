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
import com.hvsna.app.i18n.LocalStrings
import com.hvsna.app.ui.AuthLogoutReason
import com.hvsna.app.ui.AuthViewModel

private val EMAIL_REGEX = Regex("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")
private const val MIN_PASSWORD_LENGTH = 8

/** Account section embedded in [com.hvsna.app.ui.screens.SettingsLoginScreen] — renders as sibling rows in the caller's Column. */
@Composable
fun ColumnScope.AuthAccountSection(viewModel: AuthViewModel) {
    val state by viewModel.state.collectAsState()
    val strings = LocalStrings.current

    Text(strings["auth.account"], style = MaterialTheme.typography.titleMedium)

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
                Text(strings["auth.signOut"])
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
    val strings = LocalStrings.current
    Text(
        strings["auth.reconnecting"],
        style = MaterialTheme.typography.bodyMedium,
        color = MaterialTheme.colorScheme.onSurfaceVariant,
    )
    TextButton(onClick = onRetry, modifier = Modifier.fillMaxWidth()) {
        Text(strings["auth.retryNow"])
    }
}

@Composable
private fun ColumnScope.LogoutReasonBanner(reason: AuthLogoutReason) {
    val strings = LocalStrings.current
    val message = when (reason) {
        AuthLogoutReason.SECURITY_REVOKED -> strings["auth.logoutSecurity"]
        AuthLogoutReason.EXPIRED -> strings["auth.logoutExpired"]
        AuthLogoutReason.NONE -> null
    } ?: return
    Text(message, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.error)
}

@Composable
private fun ColumnScope.SignedOutForm(viewModel: AuthViewModel, loading: Boolean, error: String?) {
    val strings = LocalStrings.current
    var isSignUp by rememberSaveable { mutableStateOf(false) }
    var email by rememberSaveable { mutableStateOf("") }
    var password by rememberSaveable { mutableStateOf("") }
    var firstName by rememberSaveable { mutableStateOf("") }
    var lastName by rememberSaveable { mutableStateOf("") }
    var validationError by remember { mutableStateOf<String?>(null) }

    fun submit() {
        validationError = when {
            !EMAIL_REGEX.matches(email) -> strings["auth.invalidEmail"]
            password.length < MIN_PASSWORD_LENGTH -> strings.format("auth.passwordTooShort", MIN_PASSWORD_LENGTH)
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
        strings["auth.signInPrompt"],
        style = MaterialTheme.typography.bodyMedium,
        color = MaterialTheme.colorScheme.onSurfaceVariant,
    )

    if (isSignUp) {
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            OutlinedTextField(
                value = firstName,
                onValueChange = { firstName = it },
                label = { Text(strings["auth.firstName"]) },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
            )
            OutlinedTextField(
                value = lastName,
                onValueChange = { lastName = it },
                label = { Text(strings["auth.lastName"]) },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
            )
        }
    }

    OutlinedTextField(
        value = email,
        onValueChange = { email = it },
        label = { Text(strings["auth.email"]) },
        singleLine = true,
        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
        modifier = Modifier.fillMaxWidth(),
    )

    OutlinedTextField(
        value = password,
        onValueChange = { password = it },
        label = { Text(strings["auth.password"]) },
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
        Text(if (isSignUp) strings["auth.createAccount"] else strings["auth.signIn"])
    }

    TextButton(
        onClick = {
            isSignUp = !isSignUp
            validationError = null
            viewModel.clearError()
        },
        modifier = Modifier.fillMaxWidth(),
    ) {
        Text(if (isSignUp) strings["auth.toggleToSignIn"] else strings["auth.toggleToSignUp"])
    }
}
