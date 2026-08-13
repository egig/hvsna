package com.hvsna.app.data.migrations

import androidx.room.testing.MigrationTestHelper
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import com.hvsna.app.data.TaskDatabase
import org.json.JSONArray
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

private const val TEST_DB = "migration-test"

@RunWith(AndroidJUnit4::class)
class Migration3to4Test {
    @get:Rule
    val helper: MigrationTestHelper = MigrationTestHelper(
        InstrumentationRegistry.getInstrumentation(),
        TaskDatabase::class.java,
    )

    @Test
    fun migrate3To4_rebuildsIdsAndFieldsCorrectly() {
        helper.createDatabase(TEST_DB, 3).apply {
            // A recurrence rule with an hour/minute clock time and a materialized instance.
            execSQL(
                "INSERT INTO recurrence_rule " +
                    "(id, title, description, intervalCount, unit, anchorEpochDay, nextOccurrenceIndex, hour, minute, prayerName, isAllDay, reminderEnabled, reminderOffsetMinutes, uuid) " +
                    "VALUES (1, 'Daily standup', '', 1, 'DAY', 20000, 3, 9, 30, NULL, 0, 1, 15, 'rule-uuid-1')",
            )
            // Non-recurring, literal-time task.
            execSQL(
                "INSERT INTO Task (id, title, description, scheduledTime, isDone, prayerName, completedTime, isAllDay, recurrenceId, reminderEnabled, reminderOffsetMinutes, uuid) " +
                    "VALUES (1, 'Buy groceries', 'Milk and eggs', 1728000000000, 0, NULL, NULL, 0, NULL, 1, 0, 'task-uuid-1')",
            )
            // Materialized instance of the recurring rule, on 2024-09-01 local.
            val materializedEpoch = 1725174600000L // 2024-09-01 09:30 local-ish, exact tz doesn't matter for this assertion
            execSQL(
                "INSERT INTO Task (id, title, description, scheduledTime, isDone, prayerName, completedTime, isAllDay, recurrenceId, reminderEnabled, reminderOffsetMinutes, uuid) " +
                    "VALUES (2, 'Daily standup', '', $materializedEpoch, 0, NULL, NULL, 0, 1, 1, 15, 'task-uuid-2')",
            )
            // A prayer-anchored, all-day, and unscheduled task to exercise atTime folding.
            execSQL(
                "INSERT INTO Task (id, title, description, scheduledTime, isDone, prayerName, completedTime, isAllDay, recurrenceId, reminderEnabled, reminderOffsetMinutes, uuid) " +
                    "VALUES (3, 'Dhuhr prayer task', '', 1728010000000, 0, 'Dhuhr', NULL, 0, NULL, 0, 0, 'task-uuid-3')",
            )
            execSQL(
                "INSERT INTO Task (id, title, description, scheduledTime, isDone, prayerName, completedTime, isAllDay, recurrenceId, reminderEnabled, reminderOffsetMinutes, uuid) " +
                    "VALUES (4, 'All day errand', '', 1728020000000, 0, NULL, NULL, 1, NULL, 0, 0, 'task-uuid-4')",
            )
            execSQL(
                "INSERT INTO Task (id, title, description, scheduledTime, isDone, prayerName, completedTime, isAllDay, recurrenceId, reminderEnabled, reminderOffsetMinutes, uuid) " +
                    "VALUES (5, 'Unscheduled someday', '', NULL, 0, NULL, NULL, 0, NULL, 0, 0, 'task-uuid-5')",
            )
            execSQL("INSERT INTO Tag (id, name, color, uuid) VALUES (1, 'Work', 4283215696, 'tag-uuid-1')")
            execSQL("INSERT INTO task_tag_cross_ref (taskId, tagId, uuid) VALUES (1, 1, 'xref-uuid-1')")

            execSQL("INSERT INTO settings (`key`, value, updatedAt) VALUES ('lat', '6.2001514', 1000)")
            execSQL("INSERT INTO settings (`key`, value, updatedAt) VALUES ('lng', '106.829547', 2000)")
            execSQL("INSERT INTO settings (`key`, value, updatedAt) VALUES ('cityName', 'Jakarta', 2000)")
            execSQL("INSERT INTO settings (`key`, value, updatedAt) VALUES ('calculationMethod', 'MOON_SIGHTING_COMMITTEE', 500)")
            close()
        }

        val db = helper.runMigrationsAndValidate(TEST_DB, 4, true, MIGRATION_3_4)

        // Task ids are now the old uuid values.
        db.query("SELECT id, title, atTime, recurringTaskId, _dirty FROM Task WHERE id = 'task-uuid-1'").use { cursor ->
            assertTrue(cursor.moveToFirst())
            assertEquals("Buy groceries", cursor.getString(cursor.getColumnIndexOrThrow("title")))
            assertEquals("09:30", run { // scheduledTime's local time-of-day, formatted
                val atTimeIdx = cursor.getColumnIndexOrThrow("atTime")
                // Not asserting the exact clock value here since it's tz-dependent in this
                // seed; just confirm it's a literal "HH:mm" (contains a colon), not null/prayer.
                val v = cursor.getString(atTimeIdx)
                assertNotNull(v)
                assertTrue(v!!.contains(":"))
                v
            })
            assertNull(cursor.getString(cursor.getColumnIndexOrThrow("recurringTaskId")))
            assertEquals(1, cursor.getInt(cursor.getColumnIndexOrThrow("_dirty")))
        }

        // Prayer-anchored task keeps its prayer name as atTime (no colon).
        db.query("SELECT atTime FROM Task WHERE id = 'task-uuid-3'").use { cursor ->
            assertTrue(cursor.moveToFirst())
            assertEquals("Dhuhr", cursor.getString(0))
        }

        // All-day task's atTime is null.
        db.query("SELECT atTime FROM Task WHERE id = 'task-uuid-4'").use { cursor ->
            assertTrue(cursor.moveToFirst())
            assertNull(cursor.getString(0))
        }

        // Unscheduled task's atTime is null too.
        db.query("SELECT atTime, scheduledTime FROM Task WHERE id = 'task-uuid-5'").use { cursor ->
            assertTrue(cursor.moveToFirst())
            assertNull(cursor.getString(0))
            assertTrue(cursor.isNull(1))
        }

        // Recurrence rule: unit/intervalCount/anchorEpochDay/nextOccurrenceIndex/hour/minute
        // are gone, replaced by recurringType/recurringInterval/baseDateEpoch/atTime.
        db.query("SELECT id, recurringType, recurringInterval, atTime, occurrenceExceptions FROM recurrence_rule WHERE id = 'rule-uuid-1'").use { cursor ->
            assertTrue(cursor.moveToFirst())
            assertEquals("daily", cursor.getString(cursor.getColumnIndexOrThrow("recurringType")))
            assertEquals(1, cursor.getInt(cursor.getColumnIndexOrThrow("recurringInterval")))
            assertEquals("09:30", cursor.getString(cursor.getColumnIndexOrThrow("atTime")))
            val exceptions = cursor.getString(cursor.getColumnIndexOrThrow("occurrenceExceptions"))
            assertNotNull(exceptions)
            // The already-materialized instance's date must be recorded so the new lazy
            // generator doesn't also emit a virtual occurrence for that same date.
            assertEquals(1, JSONArray(exceptions).length())
        }

        // The materialized instance now points at the rule via its uuid-based id.
        db.query("SELECT recurringTaskId FROM Task WHERE id = 'task-uuid-2'").use { cursor ->
            assertTrue(cursor.moveToFirst())
            assertEquals("rule-uuid-1", cursor.getString(0))
        }

        // Tag and cross-ref ids are remapped to uuids too.
        db.query("SELECT id FROM Tag WHERE id = 'tag-uuid-1'").use { cursor -> assertTrue(cursor.moveToFirst()) }
        db.query("SELECT taskId, tagId FROM task_tag_cross_ref").use { cursor ->
            assertTrue(cursor.moveToFirst())
            assertEquals("task-uuid-1", cursor.getString(0))
            assertEquals("tag-uuid-1", cursor.getString(1))
        }

        // Settings: lat/lng/cityName collapsed into one `location` JSON row.
        db.query("SELECT `key` FROM settings WHERE `key` IN ('lat', 'lng', 'cityName')").use { cursor ->
            assertEquals(0, cursor.count)
        }
        db.query("SELECT value FROM settings WHERE `key` = 'location'").use { cursor ->
            assertTrue(cursor.moveToFirst())
            val json = org.json.JSONObject(cursor.getString(0))
            assertEquals(6.2001514, json.getDouble("lat"), 0.0001)
            assertEquals(106.829547, json.getDouble("lng"), 0.0001)
            assertEquals("Jakarta", json.getString("name"))
        }
        // Untouched Android-only key survives.
        db.query("SELECT value FROM settings WHERE `key` = 'calculationMethod'").use { cursor ->
            assertTrue(cursor.moveToFirst())
            assertEquals("MOON_SIGHTING_COMMITTEE", cursor.getString(0))
        }

        // New sync bookkeeping table exists.
        db.query("SELECT COUNT(*) FROM _sync_state").use { cursor ->
            assertTrue(cursor.moveToFirst())
            assertEquals(0, cursor.getInt(0))
        }
    }
}
