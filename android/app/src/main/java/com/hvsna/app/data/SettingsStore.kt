package com.hvsna.app.data

import io.objectbox.Box
import io.objectbox.BoxStore
import io.objectbox.query.QueryBuilder.StringOrder
import kotlinx.coroutines.flow.Flow

/** Replaces SettingsDao. */
class SettingsStore(boxStore: BoxStore) {
    private val box: Box<SettingsEntry> = boxStore.boxFor(SettingsEntry::class.java)

    fun observeAll(): Flow<List<SettingsEntry>> = box.query().build().asFlow()

    suspend fun upsert(entry: SettingsEntry) {
        val existing = findByKey(entry.key)
        box.put(if (existing != null) entry.copy(boxId = existing.boxId) else entry)
    }

    suspend fun upsertAll(entries: List<SettingsEntry>) {
        entries.forEach { upsert(it) }
    }

    suspend fun findByKey(key: String): SettingsEntry? =
        box.query().equal(SettingsEntry_.key, key, StringOrder.CASE_SENSITIVE).build().use { it.findUnique() }
}
