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
}

private const val KEYSET_NAME = "hvsna_auth_keyset"
private const val KEYSET_PREF_FILE = "hvsna_auth_keyset_prefs"
private const val MASTER_KEY_URI = "android-keystore://hvsna_auth_master_key"

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
}
