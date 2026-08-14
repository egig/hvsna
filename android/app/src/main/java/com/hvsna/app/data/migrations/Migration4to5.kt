package com.hvsna.app.data.migrations

import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase

/**
 * Adds recurrence_rule_tag_cross_ref, giving recurring-task templates their
 * own tag association (previously only materialized Task rows could carry
 * tags, so every not-yet-materialized virtual occurrence showed up tagless —
 * see RecurringSeriesUiModel/withVirtualOccurrences in TaskViewModel).
 */
val MIGRATION_4_5 = object : Migration(4, 5) {
    override fun migrate(db: SupportSQLiteDatabase) {
        db.execSQL(
            """
            CREATE TABLE IF NOT EXISTS `recurrence_rule_tag_cross_ref` (
                `ruleId` TEXT NOT NULL, `tagId` TEXT NOT NULL, PRIMARY KEY(`ruleId`, `tagId`),
                FOREIGN KEY(`ruleId`) REFERENCES `recurrence_rule`(`id`) ON UPDATE NO ACTION ON DELETE CASCADE,
                FOREIGN KEY(`tagId`) REFERENCES `Tag`(`id`) ON UPDATE NO ACTION ON DELETE CASCADE
            )
            """.trimIndent(),
        )
        db.execSQL("CREATE INDEX IF NOT EXISTS `index_recurrence_rule_tag_cross_ref_ruleId` ON `recurrence_rule_tag_cross_ref` (`ruleId`)")
        db.execSQL("CREATE INDEX IF NOT EXISTS `index_recurrence_rule_tag_cross_ref_tagId` ON `recurrence_rule_tag_cross_ref` (`tagId`)")
    }
}
