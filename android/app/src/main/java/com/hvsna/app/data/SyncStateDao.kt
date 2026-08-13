package com.hvsna.app.data

import androidx.room.Dao
import androidx.room.Query

@Dao
interface SyncStateDao {
    @Query("SELECT value FROM _sync_state WHERE `key` = :key")
    suspend fun get(key: String): String?

    @Query("INSERT INTO _sync_state (`key`, value) VALUES (:key, :value) ON CONFLICT(`key`) DO UPDATE SET value = :value")
    suspend fun set(key: String, value: String)
}
