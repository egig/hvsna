package com.hvsna.app.data

import android.content.Context
import com.hvsna.app.sync.HlcClock
import java.util.UUID

/**
 * The process-wide [HlcClock] every local write is stamped with, keyed by
 * this install's device id. The id is a random UUID created on first use
 * and kept in SharedPreferences (read synchronously, since TaskStore is
 * built outside coroutines); it identifies this device's file in synced
 * storage and breaks timestamp ties between devices. Clearing app data
 * makes the install a new device.
 */
object SyncClock {
    private const val PREFS = "sync_identity"
    private const val KEY_DEVICE_ID = "device_id"

    @Volatile private var instance: HlcClock? = null

    fun getInstance(context: Context): HlcClock =
        instance ?: synchronized(this) {
            instance ?: HlcClock(deviceId(context)).also { instance = it }
        }

    @Synchronized
    fun deviceId(context: Context): String {
        val prefs = context.applicationContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        prefs.getString(KEY_DEVICE_ID, null)?.let { return it }
        val id = UUID.randomUUID().toString().replace("-", "")
        prefs.edit().putString(KEY_DEVICE_ID, id).commit()
        return id
    }
}
