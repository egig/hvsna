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
}
