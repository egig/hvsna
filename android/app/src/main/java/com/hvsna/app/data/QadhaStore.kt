package com.hvsna.app.data

import io.objectbox.Box
import io.objectbox.BoxStore
import io.objectbox.query.QueryBuilder.StringOrder
import kotlinx.coroutines.flow.Flow

/**
 * ObjectBox access for [QadhaFast]. Same identity rules as [TaskStore]: rows are resolved by their
 * UUID [QadhaFast.id], and an update carries the stored row's `boxId` forward.
 */
class QadhaStore(private val boxStore: BoxStore) {
    private val box: Box<QadhaFast> = boxStore.boxFor(QadhaFast::class.java)

    private fun find(id: String): QadhaFast? =
        box.query().equal(QadhaFast_.id, id, StringOrder.CASE_SENSITIVE).build().use { it.findUnique() }

    /** Every live (not soft-deleted) row. */
    fun observeLive(): Flow<List<QadhaFast>> =
        box.query().isNull(QadhaFast_.deletedAt).order(QadhaFast_.ramadanHijriYear).build().asFlow()

    fun liveSnapshot(): List<QadhaFast> =
        box.query().isNull(QadhaFast_.deletedAt).build().use { it.find() }

    /** All rows including soft-deleted ones — what a backup exports. */
    fun allSnapshot(): List<QadhaFast> = box.all

    fun insert(rows: List<QadhaFast>) {
        box.put(rows.map { it.copy(boxId = 0) })
    }

    fun update(row: QadhaFast) {
        val existing = find(row.id) ?: return
        box.put(row.copy(boxId = existing.boxId))
    }

    fun softDelete(id: String, now: Long = System.currentTimeMillis()) {
        val existing = find(id) ?: return
        box.put(existing.copy(deletedAt = now, updatedAt = now))
    }

    /** Runs [block] in one ObjectBox write transaction, so a read-then-write cannot interleave. */
    fun <T> inTransaction(block: () -> T): T = boxStore.callInTx { block() }

    fun replaceAll(rows: List<QadhaFast>) {
        boxStore.runInTx {
            box.removeAll()
            box.put(rows.map { it.copy(boxId = 0) })
        }
    }

    /**
     * Adds rows whose UUID is not already on this device. Unlike tasks (which get fresh ids on a
     * merge import), a qadha row is a debt record: importing the same backup twice must not double
     * what the user owes, so a known id is skipped rather than duplicated.
     */
    fun mergeAll(rows: List<QadhaFast>) {
        boxStore.runInTx {
            val fresh = rows.filter { find(it.id) == null }
            box.put(fresh.map { it.copy(boxId = 0) })
        }
    }
}
