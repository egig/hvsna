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
import java.io.IOException
import java.security.GeneralSecurityException

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

    @Volatile
    private var cachedAead: Aead? = null

    private fun buildAead(): Aead {
        AeadConfig.register()
        return AndroidKeysetManager.Builder()
            .withSharedPref(appContext, KEYSET_NAME, KEYSET_PREF_FILE)
            .withKeyTemplate(KeyTemplates.get("AES256_GCM"))
            .withMasterKeyUri(MASTER_KEY_URI)
            .build()
            .keysetHandle
            .getPrimitive(RegistryConfiguration.get(), Aead::class.java)
    }

    /**
     * Tink AEAD over the Keystore-wrapped keyset. If the keyset can't be loaded
     * — the Keystore master key vanished after an app re-sign, an OS update, or
     * vendor key eviction (the `InvalidKeyException: Keystore cannot load the
     * key` crash this guards against) — the stored keyset and every ciphertext
     * that depended on it are unrecoverable. Wipe the keyset prefs and retry
     * once with a fresh keyset; the stale refresh token is dropped on the next
     * decrypt failure, silently signing the user out (the only safe outcome).
     * Returns null only if even a fresh keyset can't be built.
     */
    @Synchronized
    private fun aead(): Aead? {
        cachedAead?.let { return it }
        return try {
            buildAead().also { cachedAead = it }
        } catch (e: GeneralSecurityException) {
            recoverKeyset()
        } catch (e: IOException) {
            recoverKeyset()
        }
    }

    private fun recoverKeyset(): Aead? {
        runCatching { appContext.deleteSharedPreferences(KEYSET_PREF_FILE) }
        return runCatching { buildAead().also { cachedAead = it } }.getOrNull()
    }

    suspend fun getRefreshToken(): String? = withContext(Dispatchers.IO) {
        val encoded = appContext.authDataStore.data.first()[Keys.REFRESH_TOKEN] ?: return@withContext null
        val cipher = aead() ?: return@withContext null
        try {
            cipher.decrypt(Base64.decode(encoded, Base64.NO_WRAP), null).toString(Charsets.UTF_8)
        } catch (e: GeneralSecurityException) {
            // Keyset was reset, or the ciphertext is stale/corrupt — drop it and force a fresh sign-in.
            appContext.authDataStore.edit { prefs -> prefs.remove(Keys.REFRESH_TOKEN) }
            null
        } catch (e: IllegalArgumentException) {
            // Malformed Base64.
            appContext.authDataStore.edit { prefs -> prefs.remove(Keys.REFRESH_TOKEN) }
            null
        }
    }

    suspend fun saveRefreshToken(token: String): Unit = withContext(Dispatchers.IO) {
        val cipher = aead() ?: return@withContext
        val ciphertext = cipher.encrypt(token.toByteArray(Charsets.UTF_8), null)
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
