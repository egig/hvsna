package com.hvsna.app.data

import com.hvsna.app.sync.HlcClock
import io.objectbox.Box
import io.objectbox.BoxStore
import io.objectbox.query.QueryBuilder.StringOrder
import kotlinx.coroutines.flow.Flow

/** Replaces SettingsDao. Every write is stamped with [clock], like TaskStore's. */
class SettingsStore(boxStore: BoxStore, private val clock: HlcClock) {
    private val box: Box<SettingsEntry> = boxStore.boxFor(SettingsEntry::class.java)

    fun observeAll(): Flow<List<SettingsEntry>> = box.query().build().asFlow()

    suspend fun upsert(entry: SettingsEntry) {
        val existing = findByKey(entry.key)
        box.put(
            if (existing != null) {
                entry.copy(boxId = existing.boxId, hlc = clock.next(existing.hlc))
            } else {
                entry.copy(hlc = clock.next(entry.hlc))
            },
        )
    }

    suspend fun upsertAll(entries: List<SettingsEntry>) {
        entries.forEach { upsert(it) }
    }

    suspend fun findByKey(key: String): SettingsEntry? =
        box.query().equal(SettingsEntry_.key, key, StringOrder.CASE_SENSITIVE).build().use { it.findUnique() }
}
