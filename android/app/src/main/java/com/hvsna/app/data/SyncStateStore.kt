package com.hvsna.app.data

import io.objectbox.Box
import io.objectbox.BoxStore
import io.objectbox.query.QueryBuilder.StringOrder

/** Replaces SyncStateDao. */
class SyncStateStore(boxStore: BoxStore) {
    private val box: Box<SyncStateEntry> = boxStore.boxFor(SyncStateEntry::class.java)

    suspend fun get(key: String): String? =
        box.query().equal(SyncStateEntry_.key, key, StringOrder.CASE_SENSITIVE).build().use { it.findUnique() }?.value

    suspend fun set(key: String, value: String) {
        val existing = box.query().equal(SyncStateEntry_.key, key, StringOrder.CASE_SENSITIVE).build().use { it.findUnique() }
        box.put(SyncStateEntry(key, value, existing?.boxId ?: 0))
    }
}
