package com.hvsna.app.data

import android.content.Context
import androidx.work.WorkManager
import java.io.File
import java.security.KeyStore

/**
 * One-time, silent removal of what the account/sync builds left on disk: the encrypted refresh
 * token (DataStore file + Tink keyset prefs + Keystore master key) and the old 15-minute
 * background sync jobs. Local tasks, tags and settings are untouched.
 * Gated on a SharedPreferences flag so it runs once per install.
 */
object LegacyAccountCleanup {
    private const val PREFS = "hvsna_legacy_cleanup"
    private const val DONE = "account_sync_removed"

    fun runIfNeeded(context: Context) {
        val app = context.applicationContext
        val prefs = app.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        if (prefs.getBoolean(DONE, false)) return

        runCatching { File(app.filesDir, "datastore/auth_session.preferences_pb").delete() }
        runCatching { app.deleteSharedPreferences("hvsna_auth_keyset_prefs") }
        runCatching {
            KeyStore.getInstance("AndroidKeyStore").apply { load(null) }.deleteEntry("hvsna_auth_master_key")
        }
        // WorkManager is in use again (Drive sync), so its database can't be
        // deleted from under it; cancel the old sync jobs by name instead.
        runCatching {
            val work = WorkManager.getInstance(app)
            work.cancelUniqueWork("sync_periodic")
            work.cancelUniqueWork("sync_once")
        }

        prefs.edit().putBoolean(DONE, true).apply()
    }
}
