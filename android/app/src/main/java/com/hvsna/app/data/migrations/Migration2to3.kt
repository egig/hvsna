package com.hvsna.app.data.migrations

import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase
import java.util.UUID

/**
 * Adds a client-generated `uuid` column to Task, Tag, recurrence_rule, and
 * task_tag_cross_ref, used as a globally-unique sync identity that won't
 * collide across devices the way the local autoincrement `id` would. SQLite
 * has no built-in UUID generator, so existing rows are backfilled in Kotlin
 * one at a time rather than via a single SQL statement.
 */
val MIGRATION_2_3 = object : Migration(2, 3) {
    override fun migrate(db: SupportSQLiteDatabase) {
        backfillUuidColumn(db, table = "Task", keyColumns = listOf("id"))
        backfillUuidColumn(db, table = "Tag", keyColumns = listOf("id"))
        backfillUuidColumn(db, table = "recurrence_rule", keyColumns = listOf("id"))
        backfillUuidColumn(db, table = "task_tag_cross_ref", keyColumns = listOf("taskId", "tagId"))
    }

    private fun backfillUuidColumn(db: SupportSQLiteDatabase, table: String, keyColumns: List<String>) {
        db.execSQL("ALTER TABLE `$table` ADD COLUMN `uuid` TEXT NOT NULL DEFAULT ''")

        val keySelect = keyColumns.joinToString(", ") { "`$it`" }
        db.query("SELECT $keySelect FROM `$table`").use { cursor ->
            while (cursor.moveToNext()) {
                val keyValues = keyColumns.indices.map { cursor.getInt(it) }
                val whereClause = keyColumns.joinToString(" AND ") { "`$it` = ?" }
                db.execSQL(
                    "UPDATE `$table` SET `uuid` = ? WHERE $whereClause",
                    (listOf(UUID.randomUUID().toString()) + keyValues).toTypedArray(),
                )
            }
        }

        db.execSQL("CREATE UNIQUE INDEX IF NOT EXISTS `index_${table}_uuid` ON `$table` (`uuid`)")
    }
}
