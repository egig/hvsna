package com.hvsna.app.data.migrations

import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase
import org.json.JSONArray
import org.json.JSONObject
import java.util.Calendar

/**
 * Rebuilds Task/Tag/recurrence_rule/task_tag_cross_ref around the `uuid`
 * column added in MIGRATION_2_3 as the real primary key (matching
 * packages/api's schema so both platforms share one sync identity), adds
 * soft-delete + sync bookkeeping columns, folds hour/minute/prayerName/
 * isAllDay into a single overloaded `atTime` string (see Task.kt's doc
 * comment), and replaces the index-based recurrence model with the field
 * set the new lazy/on-the-fly generator expects. Every already-materialized
 * task tied to a recurring series has its date recorded in the new rule's
 * occurrenceExceptions so the generator doesn't re-emit a duplicate virtual
 * occurrence for a date that's already a real row. Also reshapes the
 * `settings` table's lat/lng/cityName keys into one `location` key matching
 * packages/app's LocationSetting JSON shape.
 */
val MIGRATION_3_4 = object : Migration(3, 4) {
    override fun migrate(db: SupportSQLiteDatabase) {
        val now = System.currentTimeMillis()

        // --- tag: rebuild around uuid as id ---
        db.execSQL(
            """
            CREATE TABLE `Tag_new` (
                `id` TEXT NOT NULL, `name` TEXT NOT NULL, `color` INTEGER NOT NULL,
                `createdAt` INTEGER NOT NULL, `updatedAt` INTEGER NOT NULL, `deletedAt` INTEGER,
                `_dirty` INTEGER NOT NULL, PRIMARY KEY(`id`)
            )
            """.trimIndent(),
        )
        val tagIdToUuid = mutableMapOf<Int, String>()
        db.query("SELECT id, uuid, name, color FROM `Tag`").use { cursor ->
            val idIdx = cursor.getColumnIndexOrThrow("id")
            val uuidIdx = cursor.getColumnIndexOrThrow("uuid")
            val nameIdx = cursor.getColumnIndexOrThrow("name")
            val colorIdx = cursor.getColumnIndexOrThrow("color")
            while (cursor.moveToNext()) {
                val uuid = cursor.getString(uuidIdx)
                tagIdToUuid[cursor.getInt(idIdx)] = uuid
                db.execSQL(
                    "INSERT INTO `Tag_new` (id, name, color, createdAt, updatedAt, deletedAt, _dirty) VALUES (?, ?, ?, ?, ?, NULL, 1)",
                    arrayOf(uuid, cursor.getString(nameIdx), cursor.getLong(colorIdx), now, now),
                )
            }
        }
        db.execSQL("DROP TABLE `Tag`")
        db.execSQL("ALTER TABLE `Tag_new` RENAME TO `Tag`")

        // --- recurrence_rule: full rebuild, old int id -> uuid, new field set ---
        db.execSQL(
            """
            CREATE TABLE `recurrence_rule_new` (
                `id` TEXT NOT NULL, `title` TEXT NOT NULL, `description` TEXT NOT NULL,
                `recurringType` TEXT NOT NULL, `recurringInterval` INTEGER NOT NULL,
                `baseDateEpoch` INTEGER NOT NULL, `atTime` TEXT, `lat` REAL, `lng` REAL,
                `timezone` TEXT, `hijriDateOffset` INTEGER, `recurringEnd` TEXT,
                `recurringEndEpoch` INTEGER, `recurringEndOccurrences` INTEGER,
                `useGregorian` INTEGER NOT NULL, `occurrenceExceptions` TEXT,
                `reminderEnabled` INTEGER NOT NULL, `reminderOffsetMinutes` INTEGER NOT NULL,
                `createdAt` INTEGER NOT NULL, `updatedAt` INTEGER NOT NULL, `deletedAt` INTEGER,
                `_dirty` INTEGER NOT NULL, PRIMARY KEY(`id`)
            )
            """.trimIndent(),
        )
        val ruleIdToUuid = mutableMapOf<Int, String>()
        db.query(
            "SELECT id, uuid, title, description, intervalCount, unit, anchorEpochDay, hour, minute, prayerName, isAllDay, reminderEnabled, reminderOffsetMinutes FROM `recurrence_rule`"
        ).use { cursor ->
            val idIdx = cursor.getColumnIndexOrThrow("id")
            val uuidIdx = cursor.getColumnIndexOrThrow("uuid")
            val titleIdx = cursor.getColumnIndexOrThrow("title")
            val descIdx = cursor.getColumnIndexOrThrow("description")
            val intervalIdx = cursor.getColumnIndexOrThrow("intervalCount")
            val unitIdx = cursor.getColumnIndexOrThrow("unit")
            val anchorDayIdx = cursor.getColumnIndexOrThrow("anchorEpochDay")
            val hourIdx = cursor.getColumnIndexOrThrow("hour")
            val minuteIdx = cursor.getColumnIndexOrThrow("minute")
            val prayerIdx = cursor.getColumnIndexOrThrow("prayerName")
            val allDayIdx = cursor.getColumnIndexOrThrow("isAllDay")
            val remEnabledIdx = cursor.getColumnIndexOrThrow("reminderEnabled")
            val remOffsetIdx = cursor.getColumnIndexOrThrow("reminderOffsetMinutes")

            while (cursor.moveToNext()) {
                val oldId = cursor.getInt(idIdx)
                val uuid = cursor.getString(uuidIdx)
                ruleIdToUuid[oldId] = uuid

                val isAllDay = cursor.getInt(allDayIdx) != 0
                val prayerName = if (cursor.isNull(prayerIdx)) null else cursor.getString(prayerIdx)
                val hour = if (cursor.isNull(hourIdx)) null else cursor.getInt(hourIdx)
                val minute = if (cursor.isNull(minuteIdx)) null else cursor.getInt(minuteIdx)
                val atTime = when {
                    isAllDay -> null
                    prayerName != null -> prayerName
                    hour != null -> "%02d:%02d".format(hour, minute ?: 0)
                    else -> null
                }
                val recurringType = when (cursor.getString(unitIdx)) {
                    "DAY" -> "daily"
                    "WEEK" -> "weekly"
                    "MONTH" -> "monthly"
                    else -> "daily"
                }
                // Only the calendar date matters going forward — the new generator
                // resolves each occurrence's actual instant from (date, atTime)
                // itself, so baseDateEpoch's time-of-day is inconsequential.
                val anchorDateCal = Calendar.getInstance().apply {
                    timeInMillis = 0L
                    add(Calendar.DAY_OF_YEAR, cursor.getLong(anchorDayIdx).toInt())
                    set(Calendar.HOUR_OF_DAY, 0); set(Calendar.MINUTE, 0); set(Calendar.SECOND, 0); set(Calendar.MILLISECOND, 0)
                }
                val baseDateEpoch = anchorDateCal.timeInMillis

                db.execSQL(
                    """
                    INSERT INTO `recurrence_rule_new`
                    (id, title, description, recurringType, recurringInterval, baseDateEpoch, atTime,
                     lat, lng, timezone, hijriDateOffset, recurringEnd, recurringEndEpoch, recurringEndOccurrences,
                     useGregorian, occurrenceExceptions, reminderEnabled, reminderOffsetMinutes,
                     createdAt, updatedAt, deletedAt, _dirty)
                    VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL, NULL, 'never', NULL, NULL, 0, NULL, ?, ?, ?, ?, NULL, 1)
                    """.trimIndent(),
                    arrayOf(
                        uuid, cursor.getString(titleIdx), cursor.getString(descIdx), recurringType,
                        cursor.getInt(intervalIdx), baseDateEpoch, atTime,
                        cursor.getInt(remEnabledIdx), cursor.getInt(remOffsetIdx), now, now,
                    ),
                )
            }
        }
        db.execSQL("DROP TABLE `recurrence_rule`")
        db.execSQL("ALTER TABLE `recurrence_rule_new` RENAME TO `recurrence_rule`")

        // --- task: rebuild around uuid as id, fold prayerName/isAllDay into atTime ---
        db.execSQL(
            """
            CREATE TABLE `Task_new` (
                `id` TEXT NOT NULL, `title` TEXT NOT NULL, `description` TEXT NOT NULL,
                `scheduledTime` INTEGER, `isDone` INTEGER NOT NULL, `atTime` TEXT,
                `completedTime` INTEGER, `recurringTaskId` TEXT, `recurringType` TEXT,
                `recurringInterval` INTEGER, `lat` REAL, `lng` REAL, `timezone` TEXT,
                `hijriDateOffset` INTEGER, `reminderEnabled` INTEGER NOT NULL,
                `reminderOffsetMinutes` INTEGER NOT NULL, `createdAt` INTEGER NOT NULL,
                `updatedAt` INTEGER NOT NULL, `deletedAt` INTEGER, `_dirty` INTEGER NOT NULL,
                PRIMARY KEY(`id`),
                FOREIGN KEY(`recurringTaskId`) REFERENCES `recurrence_rule`(`id`) ON UPDATE NO ACTION ON DELETE SET NULL
            )
            """.trimIndent(),
        )
        val taskIdToUuid = mutableMapOf<Int, String>()
        val exceptionsByRule = mutableMapOf<String, MutableList<String>>()
        db.query(
            "SELECT id, uuid, title, description, scheduledTime, isDone, prayerName, completedTime, isAllDay, recurrenceId, reminderEnabled, reminderOffsetMinutes FROM `Task`"
        ).use { cursor ->
            val idIdx = cursor.getColumnIndexOrThrow("id")
            val uuidIdx = cursor.getColumnIndexOrThrow("uuid")
            val titleIdx = cursor.getColumnIndexOrThrow("title")
            val descIdx = cursor.getColumnIndexOrThrow("description")
            val schedIdx = cursor.getColumnIndexOrThrow("scheduledTime")
            val doneIdx = cursor.getColumnIndexOrThrow("isDone")
            val prayerIdx = cursor.getColumnIndexOrThrow("prayerName")
            val completedIdx = cursor.getColumnIndexOrThrow("completedTime")
            val allDayIdx = cursor.getColumnIndexOrThrow("isAllDay")
            val recIdIdx = cursor.getColumnIndexOrThrow("recurrenceId")
            val remEnabledIdx = cursor.getColumnIndexOrThrow("reminderEnabled")
            val remOffsetIdx = cursor.getColumnIndexOrThrow("reminderOffsetMinutes")

            while (cursor.moveToNext()) {
                val uuid = cursor.getString(uuidIdx)
                taskIdToUuid[cursor.getInt(idIdx)] = uuid

                val scheduledTime = if (cursor.isNull(schedIdx)) null else cursor.getLong(schedIdx)
                val isAllDay = cursor.getInt(allDayIdx) != 0
                val prayerName = if (cursor.isNull(prayerIdx)) null else cursor.getString(prayerIdx)
                val atTime = when {
                    isAllDay -> null
                    prayerName != null -> prayerName
                    scheduledTime != null -> {
                        val cal = Calendar.getInstance().apply { timeInMillis = scheduledTime }
                        "%02d:%02d".format(cal.get(Calendar.HOUR_OF_DAY), cal.get(Calendar.MINUTE))
                    }
                    else -> null
                }
                val recurringTaskId = if (cursor.isNull(recIdIdx)) null else ruleIdToUuid[cursor.getInt(recIdIdx)]

                if (recurringTaskId != null && scheduledTime != null) {
                    val cal = Calendar.getInstance().apply { timeInMillis = scheduledTime }
                    val dateStr = "%04d%02d%02d".format(cal.get(Calendar.YEAR), cal.get(Calendar.MONTH) + 1, cal.get(Calendar.DAY_OF_MONTH))
                    exceptionsByRule.getOrPut(recurringTaskId) { mutableListOf() }.add(dateStr)
                }

                db.execSQL(
                    """
                    INSERT INTO `Task_new`
                    (id, title, description, scheduledTime, isDone, atTime, completedTime,
                     recurringTaskId, recurringType, recurringInterval, lat, lng, timezone, hijriDateOffset,
                     reminderEnabled, reminderOffsetMinutes, createdAt, updatedAt, deletedAt, _dirty)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL, NULL, NULL, NULL, ?, ?, ?, ?, NULL, 1)
                    """.trimIndent(),
                    arrayOf(
                        uuid, cursor.getString(titleIdx), cursor.getString(descIdx), scheduledTime,
                        cursor.getInt(doneIdx), atTime, if (cursor.isNull(completedIdx)) null else cursor.getLong(completedIdx),
                        recurringTaskId, cursor.getInt(remEnabledIdx), cursor.getInt(remOffsetIdx), now, now,
                    ),
                )
            }
        }
        exceptionsByRule.forEach { (ruleUuid, dates) ->
            db.execSQL(
                "UPDATE `recurrence_rule` SET occurrenceExceptions = ? WHERE id = ?",
                arrayOf(JSONArray(dates).toString(), ruleUuid),
            )
        }
        db.execSQL("DROP TABLE `Task`")
        db.execSQL("ALTER TABLE `Task_new` RENAME TO `Task`")
        db.execSQL("CREATE INDEX IF NOT EXISTS `index_Task_recurringTaskId` ON `Task` (`recurringTaskId`)")

        // --- task_tag_cross_ref: remap int taskId/tagId to uuid ---
        db.execSQL(
            """
            CREATE TABLE `task_tag_cross_ref_new` (
                `taskId` TEXT NOT NULL, `tagId` TEXT NOT NULL, PRIMARY KEY(`taskId`, `tagId`),
                FOREIGN KEY(`taskId`) REFERENCES `Task`(`id`) ON UPDATE NO ACTION ON DELETE CASCADE,
                FOREIGN KEY(`tagId`) REFERENCES `Tag`(`id`) ON UPDATE NO ACTION ON DELETE CASCADE
            )
            """.trimIndent(),
        )
        db.query("SELECT taskId, tagId FROM `task_tag_cross_ref`").use { cursor ->
            val taskIdIdx = cursor.getColumnIndexOrThrow("taskId")
            val tagIdIdx = cursor.getColumnIndexOrThrow("tagId")
            while (cursor.moveToNext()) {
                val newTaskId = taskIdToUuid[cursor.getInt(taskIdIdx)] ?: continue
                val newTagId = tagIdToUuid[cursor.getInt(tagIdIdx)] ?: continue
                db.execSQL(
                    "INSERT INTO `task_tag_cross_ref_new` (taskId, tagId) VALUES (?, ?)",
                    arrayOf(newTaskId, newTagId),
                )
            }
        }
        db.execSQL("DROP TABLE `task_tag_cross_ref`")
        db.execSQL("ALTER TABLE `task_tag_cross_ref_new` RENAME TO `task_tag_cross_ref`")
        db.execSQL("CREATE INDEX IF NOT EXISTS `index_task_tag_cross_ref_taskId` ON `task_tag_cross_ref` (`taskId`)")
        db.execSQL("CREATE INDEX IF NOT EXISTS `index_task_tag_cross_ref_tagId` ON `task_tag_cross_ref` (`tagId`)")

        // --- settings: add _dirty, reshape lat/lng/cityName into one `location` key ---
        db.execSQL("ALTER TABLE `settings` ADD COLUMN `_dirty` INTEGER NOT NULL DEFAULT 1")

        var lat: Double? = null
        var lng: Double? = null
        var cityName: String? = null
        var maxUpdatedAt = 0L
        db.query("SELECT `key`, `value`, `updatedAt` FROM `settings` WHERE `key` IN ('lat', 'lng', 'cityName')").use { cursor ->
            val keyIdx = cursor.getColumnIndexOrThrow("key")
            val valueIdx = cursor.getColumnIndexOrThrow("value")
            val updatedIdx = cursor.getColumnIndexOrThrow("updatedAt")
            while (cursor.moveToNext()) {
                maxUpdatedAt = maxOf(maxUpdatedAt, cursor.getLong(updatedIdx))
                when (cursor.getString(keyIdx)) {
                    "lat" -> lat = cursor.getString(valueIdx).toDoubleOrNull()
                    "lng" -> lng = cursor.getString(valueIdx).toDoubleOrNull()
                    "cityName" -> cityName = cursor.getString(valueIdx)
                }
            }
        }
        db.execSQL("DELETE FROM `settings` WHERE `key` IN ('lat', 'lng', 'cityName')")
        if (lat != null || lng != null) {
            val locationJson = JSONObject().apply {
                put("source", "manual")
                put("resolvedAt", maxUpdatedAt)
                put("lat", lat ?: 0.0)
                put("lng", lng ?: 0.0)
                put("name", cityName ?: "")
            }.toString()
            db.execSQL(
                "INSERT INTO `settings` (`key`, `value`, `updatedAt`, `_dirty`) VALUES ('location', ?, ?, 1)",
                arrayOf(locationJson, maxUpdatedAt),
            )
        }

        // --- new sync bookkeeping table ---
        db.execSQL(
            """
            CREATE TABLE IF NOT EXISTS `_sync_state` (
                `key` TEXT NOT NULL, `value` TEXT NOT NULL, PRIMARY KEY(`key`)
            )
            """.trimIndent(),
        )
    }
}
