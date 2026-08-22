package com.hvsna.app.auth

import android.content.Context
import android.util.Base64
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.google.crypto.tink.Aead
import com.google.crypto.tink.KeyTemplates
import com.google.crypto.tink.RegistryConfiguration
import com.google.crypto.tink.aead.AeadConfig
import com.google.crypto.tink.integration.android.AndroidKeysetManager
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.withContext

private val Context.authDataStore: DataStore<Preferences> by preferencesDataStore(name = "auth_session")

private object Keys {
    val REFRESH_TOKEN = stringPreferencesKey("refresh_token")
    val LOGOUT_REASON = stringPreferencesKey("logout_reason")
}

private const val KEYSET_NAME = "hvsna_auth_keyset"
private const val KEYSET_PREF_FILE = "hvsna_auth_keyset_prefs"
private const val MASTER_KEY_URI = "android-keystore://hvsna_auth_master_key"

/**
 * Why the last session ended — recorded by [AuthService] whenever it clears the stored
 * session, including from a background [com.hvsna.app.sync.SyncWorker] run with no UI in
 * front of it. [AuthViewModel][com.hvsna.app.ui.AuthViewModel] consumes (reads-and-clears)
 * this once on the next start so a background-discovered logout still gets an accurate
 * message instead of just silently landing on the sign-in form.
 */
enum class LogoutReason { NONE, EXPIRED, SECURITY_REVOKED }

/**
 * Persists the refresh token in DataStore, encrypted with Tink directly — androidx.security's
 * EncryptedSharedPreferences/MasterKey are deprecated in favor of exactly this: a Tink AEAD
 * primitive (its keyset wrapped by an Android Keystore master key) over Jetpack DataStore.
 */
class SessionRepository(context: Context) {
    private val appContext = context.applicationContext

    private val aead: Aead by lazy {
        AeadConfig.register()
        AndroidKeysetManager.Builder()
            .withSharedPref(appContext, KEYSET_NAME, KEYSET_PREF_FILE)
            .withKeyTemplate(KeyTemplates.get("AES256_GCM"))
            .withMasterKeyUri(MASTER_KEY_URI)
            .build()
            .keysetHandle
            .getPrimitive(RegistryConfiguration.get(), Aead::class.java)
    }

    suspend fun getRefreshToken(): String? = withContext(Dispatchers.IO) {
        val encoded = appContext.authDataStore.data.first()[Keys.REFRESH_TOKEN] ?: return@withContext null
        val plaintext = aead.decrypt(Base64.decode(encoded, Base64.NO_WRAP), null)
        plaintext.toString(Charsets.UTF_8)
    }

    suspend fun saveRefreshToken(token: String) = withContext(Dispatchers.IO) {
        val ciphertext = aead.encrypt(token.toByteArray(Charsets.UTF_8), null)
        val encoded = Base64.encodeToString(ciphertext, Base64.NO_WRAP)
        appContext.authDataStore.edit { prefs -> prefs[Keys.REFRESH_TOKEN] = encoded }
    }

    suspend fun clearRefreshToken() = withContext(Dispatchers.IO) {
        appContext.authDataStore.edit { prefs -> prefs.remove(Keys.REFRESH_TOKEN) }
    }

    suspend fun setLogoutReason(reason: LogoutReason) = withContext(Dispatchers.IO) {
        appContext.authDataStore.edit { prefs -> prefs[Keys.LOGOUT_REASON] = reason.name }
    }

    /** Reads and clears the stored reason — each one is surfaced to the UI at most once. */
    suspend fun consumeLogoutReason(): LogoutReason = withContext(Dispatchers.IO) {
        val stored = appContext.authDataStore.data.first()[Keys.LOGOUT_REASON]
        appContext.authDataStore.edit { prefs -> prefs.remove(Keys.LOGOUT_REASON) }
        stored?.let { runCatching { LogoutReason.valueOf(it) }.getOrNull() } ?: LogoutReason.NONE
    }
}
