package com.hvsna.app.data.migrations

import androidx.room.testing.MigrationTestHelper
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import com.hvsna.app.data.TaskDatabase
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

private const val TEST_DB = "migration-test"

@RunWith(AndroidJUnit4::class)
class Migration2to3Test {
    @get:Rule
    val helper: MigrationTestHelper = MigrationTestHelper(
        InstrumentationRegistry.getInstrumentation(),
        TaskDatabase::class.java,
    )

    @Test
    fun migrate2To3_backfillsNonEmptyUniqueUuids() {
        helper.createDatabase(TEST_DB, 2).apply {
            execSQL(
                "INSERT INTO Task (id, title, description, isDone, isAllDay, reminderEnabled, reminderOffsetMinutes) " +
                    "VALUES (1, 'Task 1', '', 0, 0, 0, 0)",
            )
            execSQL(
                "INSERT INTO Task (id, title, description, isDone, isAllDay, reminderEnabled, reminderOffsetMinutes) " +
                    "VALUES (2, 'Task 2', '', 0, 0, 0, 0)",
            )
            execSQL("INSERT INTO Tag (id, name, color) VALUES (1, 'Tag 1', 0)")
            execSQL(
                "INSERT INTO recurrence_rule " +
                    "(id, title, description, intervalCount, unit, anchorEpochDay, nextOccurrenceIndex, isAllDay, reminderEnabled, reminderOffsetMinutes) " +
                    "VALUES (1, 'Rule 1', '', 1, 'DAY', 0, 0, 0, 0, 0)",
            )
            execSQL("INSERT INTO task_tag_cross_ref (taskId, tagId) VALUES (1, 1)")
            close()
        }

        val db = helper.runMigrationsAndValidate(TEST_DB, 3, true, MIGRATION_2_3)

        fun uuidsFor(table: String): List<String> {
            val uuids = mutableListOf<String>()
            db.query("SELECT uuid FROM `$table`").use { cursor ->
                while (cursor.moveToNext()) uuids += cursor.getString(0)
            }
            return uuids
        }

        val taskUuids = uuidsFor("Task")
        assertEquals(2, taskUuids.size)
        assertTrue(taskUuids.all { it.isNotBlank() })
        assertEquals(taskUuids.size, taskUuids.toSet().size)

        val tagUuids = uuidsFor("Tag")
        assertEquals(1, tagUuids.size)
        assertTrue(tagUuids.all { it.isNotBlank() })

        val ruleUuids = uuidsFor("recurrence_rule")
        assertEquals(1, ruleUuids.size)
        assertTrue(ruleUuids.all { it.isNotBlank() })

        val crossRefUuids = uuidsFor("task_tag_cross_ref")
        assertEquals(1, crossRefUuids.size)
        assertTrue(crossRefUuids.all { it.isNotBlank() })
    }
}
