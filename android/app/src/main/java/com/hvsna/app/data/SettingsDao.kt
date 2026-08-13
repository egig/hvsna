package com.hvsna.app.data

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface SettingsDao {
    @Query("SELECT * FROM settings")
    fun observeAll(): Flow<List<SettingsEntry>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(entry: SettingsEntry)

    /** Inserted as a single transaction (Room wraps multi-row @Insert calls automatically). */
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertAll(entries: List<SettingsEntry>)

    @Query("SELECT * FROM settings WHERE `key` = :key")
    suspend fun findByKey(key: String): SettingsEntry?

    /** LWW-guarded apply — see TaskDao's applyIncomingTask doc comment for why this isn't a single SQL statement. */
    suspend fun applyIncoming(incoming: SettingsEntry): Boolean {
        val existing = findByKey(incoming.key)
        if (existing != null && existing.updatedAt >= incoming.updatedAt) return false
        upsert(incoming.copy(_dirty = 0))
        return true
    }

    @Query("SELECT * FROM settings WHERE _dirty = 1 LIMIT :limit")
    suspend fun findDirty(limit: Int): List<SettingsEntry>

    @Query("UPDATE settings SET _dirty = 0 WHERE `key` IN (:keys)")
    suspend fun clearDirty(keys: List<String>)
}
