package com.hvsna.app.data

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.withContext
import java.time.LocalDate

/**
 * Qadha tracker operations. Validation lives in the pure functions of QadhaLogic.kt; this class
 * applies them inside a write transaction so the check and the write see the same data.
 */
class QadhaRepository(private val store: QadhaStore) {

    val liveRows: Flow<List<QadhaFast>> = store.observeLive()

    suspend fun addOwed(count: Int, ramadanHijriYear: Int, reason: String) = withContext(Dispatchers.IO) {
        store.insert(newOwedQadha(count, ramadanHijriYear, reason))
    }

    /**
     * Marks the oldest eligible owed fast as made up on [date]. The row is written only for
     * [MadeUpDateCheck.OK], or for [MadeUpDateCheck.WARN_TASHRIQ] when the user confirmed
     * ([confirmedWarning]); a write always returns [MadeUpDateCheck.OK], anything else returns the
     * check that blocked it.
     */
    suspend fun logMadeUp(
        date: LocalDate,
        today: LocalDate,
        monthOffsets: Map<Int, Int>,
        confirmedWarning: Boolean = false,
    ): MadeUpDateCheck = withContext(Dispatchers.IO) {
        store.inTransaction {
            val rows = store.liveSnapshot()
            val check = checkMadeUpDate(date, today, rows, monthOffsets)
            val writable = check == MadeUpDateCheck.OK || (check == MadeUpDateCheck.WARN_TASHRIQ && confirmedWarning)
            val target = if (writable) oldestOwedFor(rows, date, monthOffsets) else null
            if (target != null) {
                store.update(target.copy(madeUpOn = date.toString(), updatedAt = System.currentTimeMillis()))
                MadeUpDateCheck.OK
            } else {
                check
            }
        }
    }

    /** Returns a made-up row to owed (undo of [logMadeUp]). */
    suspend fun markOwedAgain(row: QadhaFast) = withContext(Dispatchers.IO) {
        store.update(row.copy(madeUpOn = null, updatedAt = System.currentTimeMillis()))
    }

    suspend fun delete(row: QadhaFast) = withContext(Dispatchers.IO) {
        store.softDelete(row.id)
    }

    fun allSnapshot(): List<QadhaFast> = store.allSnapshot()
    fun replaceAll(rows: List<QadhaFast>) = store.replaceAll(rows)
    fun mergeAll(rows: List<QadhaFast>) = store.mergeAll(rows)
}
