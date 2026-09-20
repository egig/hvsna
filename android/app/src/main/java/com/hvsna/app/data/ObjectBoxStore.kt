package com.hvsna.app.data

import android.content.Context
import io.objectbox.BoxStore

/**
 * ObjectBox needs no version number or migration list — schema evolution
 * (new/removed/renamed fields) is automatic. The one thing that *does*
 * still need explicit handling is data already sitting in a pre-update
 * local database file on an existing install; see [RoomToObjectBoxImporter],
 * run once from here before the store is first handed out.
 */
object ObjectBoxStore {
    @Volatile private var instance: BoxStore? = null

    fun getInstance(context: Context): BoxStore =
        instance ?: synchronized(this) {
            instance ?: run {
                val appContext = context.applicationContext
                val store = MyObjectBox.builder().androidContext(appContext).build()
                RoomToObjectBoxImporter.migrateIfNeeded(appContext, store)
                instance = store
                store
            }
        }
}
