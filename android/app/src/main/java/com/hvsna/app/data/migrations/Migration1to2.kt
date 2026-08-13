package com.hvsna.app.data.migrations

import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase

/**
 * Adds the `settings` key-value table backing the new Room-based
 * SettingsRepository. No rows are seeded — a missing key simply means the
 * repository falls back to its default value, so new setting keys never
 * require another migration.
 */
val MIGRATION_1_2 = object : Migration(1, 2) {
    override fun migrate(db: SupportSQLiteDatabase) {
        db.execSQL(
            """
            CREATE TABLE IF NOT EXISTS `settings` (
                `key` TEXT NOT NULL,
                `value` TEXT NOT NULL,
                `updatedAt` INTEGER NOT NULL,
                PRIMARY KEY(`key`)
            )
            """.trimIndent(),
        )
    }
}
