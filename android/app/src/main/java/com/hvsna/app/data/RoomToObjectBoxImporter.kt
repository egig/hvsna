package com.hvsna.app.data

import android.content.Context
import android.database.Cursor
import android.database.sqlite.SQLiteDatabase
import io.objectbox.BoxStore

/**
 * This app is local-first — tasks can exist before signup/sync — so an
 * existing install's data lives only in its legacy SQLite file (`task_db`,
 * schema v5) until this runs once. ObjectBox can't read that file, so on
 * first launch this walks every v5 table with a plain read-only
 * SQLiteDatabase and re-inserts everything into the fresh ObjectBox store,
 * then deletes the old db file so this never runs again. A fresh install
 * has no `task_db` file at all, so [migrateIfNeeded] is a cheap no-op for
 * it.
 *
 * Runs synchronously on whatever thread first calls [ObjectBoxStore.getInstance] —
 * a one-time cost bounded by a single user's local task count, not a
 * concern at this app's scale.
 */
object RoomToObjectBoxImporter {
    private const val PREFS_NAME = "objectbox_migration"
    private const val KEY_MIGRATED = "migrated_from_room"
    private const val ROOM_DB_NAME = "task_db"

    fun migrateIfNeeded(context: Context, store: BoxStore) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        if (prefs.getBoolean(KEY_MIGRATED, false)) return

        val dbFile = context.getDatabasePath(ROOM_DB_NAME)
        if (dbFile.exists()) {
            importFrom(dbFile.path, store)
            context.deleteDatabase(ROOM_DB_NAME)
        }
        prefs.edit().putBoolean(KEY_MIGRATED, true).apply()
    }

    /** Exposed separately so tests can point it at a fixture db file without touching the real `task_db`/SharedPreferences flag. */
    fun importFrom(sqlitePath: String, store: BoxStore) {
        val db = SQLiteDatabase.openDatabase(sqlitePath, null, SQLiteDatabase.OPEN_READONLY)
        db.use {
            val tagIdByUuid = importTags(db, store)
            val ruleIdByUuid = importRecurrenceRules(db, store)
            importTasks(db, store)
            importTaskTagCrossRefs(db, store, tagIdByUuid)
            importRecurrenceRuleTagCrossRefs(db, store, ruleIdByUuid)
            importSettings(db, store)
            importSyncState(db, store)
        }
    }

    private fun importTags(db: SQLiteDatabase, store: BoxStore): Map<String, Long> {
        val box = store.boxFor(Tag::class.java)
        val idByUuid = mutableMapOf<String, Long>()
        db.rawQuery("SELECT id, name, color, createdAt, updatedAt, deletedAt, _dirty FROM Tag", null).use { c ->
            while (c.moveToNext()) {
                val tag = Tag(
                    id = c.getString(c.getColumnIndexOrThrow("id")),
                    name = c.getString(c.getColumnIndexOrThrow("name")),
                    color = c.getLong(c.getColumnIndexOrThrow("color")),
                    createdAt = c.getLong(c.getColumnIndexOrThrow("createdAt")),
                    updatedAt = c.getLong(c.getColumnIndexOrThrow("updatedAt")),
                    deletedAt = c.getLongOrNull("deletedAt"),
                    _dirty = c.getInt(c.getColumnIndexOrThrow("_dirty")),
                )
                val boxId = box.put(tag)
                idByUuid[tag.id] = boxId
            }
        }
        return idByUuid
    }

    private fun importRecurrenceRules(db: SQLiteDatabase, store: BoxStore): Map<String, Long> {
        val box = store.boxFor(RecurrenceRule::class.java)
        val idByUuid = mutableMapOf<String, Long>()
        db.rawQuery(
            """SELECT id, title, description, recurringType, recurringInterval, baseDateEpoch, atTime, lat, lng, timezone,
               hijriDateOffset, recurringEnd, recurringEndEpoch, recurringEndOccurrences, useGregorian, occurrenceExceptions,
               reminderEnabled, reminderOffsetMinutes, createdAt, updatedAt, deletedAt, _dirty FROM recurrence_rule""",
            null,
        ).use { c ->
            while (c.moveToNext()) {
                val rule = RecurrenceRule(
                    id = c.getString(c.getColumnIndexOrThrow("id")),
                    title = c.getString(c.getColumnIndexOrThrow("title")),
                    description = c.getString(c.getColumnIndexOrThrow("description")),
                    recurringType = c.getString(c.getColumnIndexOrThrow("recurringType")),
                    recurringInterval = c.getInt(c.getColumnIndexOrThrow("recurringInterval")),
                    baseDateEpoch = c.getLong(c.getColumnIndexOrThrow("baseDateEpoch")),
                    atTime = c.getStringOrNull("atTime"),
                    lat = c.getDoubleOrNull("lat"),
                    lng = c.getDoubleOrNull("lng"),
                    timezone = c.getStringOrNull("timezone"),
                    hijriDateOffset = c.getIntOrNull("hijriDateOffset"),
                    recurringEnd = c.getStringOrNull("recurringEnd"),
                    recurringEndEpoch = c.getLongOrNull("recurringEndEpoch"),
                    recurringEndOccurrences = c.getIntOrNull("recurringEndOccurrences"),
                    useGregorian = c.getInt(c.getColumnIndexOrThrow("useGregorian")) != 0,
                    occurrenceExceptions = c.getStringOrNull("occurrenceExceptions"),
                    reminderEnabled = c.getInt(c.getColumnIndexOrThrow("reminderEnabled")) != 0,
                    reminderOffsetMinutes = c.getInt(c.getColumnIndexOrThrow("reminderOffsetMinutes")),
                    createdAt = c.getLong(c.getColumnIndexOrThrow("createdAt")),
                    updatedAt = c.getLong(c.getColumnIndexOrThrow("updatedAt")),
                    deletedAt = c.getLongOrNull("deletedAt"),
                    _dirty = c.getInt(c.getColumnIndexOrThrow("_dirty")),
                )
                val boxId = box.put(rule)
                idByUuid[rule.id] = boxId
            }
        }
        return idByUuid
    }

    private fun importTasks(db: SQLiteDatabase, store: BoxStore) {
        val box = store.boxFor(Task::class.java)
        db.rawQuery(
            """SELECT id, title, description, scheduledTime, isDone, atTime, completedTime, recurringTaskId, recurringType,
               recurringInterval, lat, lng, timezone, hijriDateOffset, reminderEnabled, reminderOffsetMinutes,
               createdAt, updatedAt, deletedAt, _dirty FROM Task""",
            null,
        ).use { c ->
            while (c.moveToNext()) {
                val task = Task(
                    id = c.getString(c.getColumnIndexOrThrow("id")),
                    title = c.getString(c.getColumnIndexOrThrow("title")),
                    description = c.getString(c.getColumnIndexOrThrow("description")),
                    scheduledTime = c.getLongOrNull("scheduledTime"),
                    isDone = c.getInt(c.getColumnIndexOrThrow("isDone")),
                    atTime = c.getStringOrNull("atTime"),
                    completedTime = c.getLongOrNull("completedTime"),
                    recurringTaskId = c.getStringOrNull("recurringTaskId"),
                    recurringType = c.getStringOrNull("recurringType"),
                    recurringInterval = c.getIntOrNull("recurringInterval"),
                    lat = c.getDoubleOrNull("lat"),
                    lng = c.getDoubleOrNull("lng"),
                    timezone = c.getStringOrNull("timezone"),
                    hijriDateOffset = c.getIntOrNull("hijriDateOffset"),
                    reminderEnabled = c.getInt(c.getColumnIndexOrThrow("reminderEnabled")) != 0,
                    reminderOffsetMinutes = c.getInt(c.getColumnIndexOrThrow("reminderOffsetMinutes")),
                    createdAt = c.getLong(c.getColumnIndexOrThrow("createdAt")),
                    updatedAt = c.getLong(c.getColumnIndexOrThrow("updatedAt")),
                    deletedAt = c.getLongOrNull("deletedAt"),
                    _dirty = c.getInt(c.getColumnIndexOrThrow("_dirty")),
                )
                box.put(task)
            }
        }
    }

    private fun importTaskTagCrossRefs(db: SQLiteDatabase, store: BoxStore, tagBoxIdByUuid: Map<String, Long>) {
        val taskBox = store.boxFor(Task::class.java)
        val tagBox = store.boxFor(Tag::class.java)
        db.rawQuery("SELECT taskId, tagId FROM task_tag_cross_ref", null).use { c ->
            while (c.moveToNext()) {
                val taskUuid = c.getString(c.getColumnIndexOrThrow("taskId"))
                val tagUuid = c.getString(c.getColumnIndexOrThrow("tagId"))
                val tagBoxId = tagBoxIdByUuid[tagUuid] ?: continue
                val task = taskBox.query().equal(Task_.id, taskUuid, io.objectbox.query.QueryBuilder.StringOrder.CASE_SENSITIVE)
                    .build().use { it.findUnique() } ?: continue
                val tag = tagBox.get(tagBoxId) ?: continue
                task.tags.add(tag)
                task.tags.applyChangesToDb()
            }
        }
    }

    private fun importRecurrenceRuleTagCrossRefs(db: SQLiteDatabase, store: BoxStore, ruleBoxIdByUuid: Map<String, Long>) {
        val ruleBox = store.boxFor(RecurrenceRule::class.java)
        val tagBox = store.boxFor(Tag::class.java)
        db.rawQuery("SELECT ruleId, tagId FROM recurrence_rule_tag_cross_ref", null).use { c ->
            while (c.moveToNext()) {
                val ruleUuid = c.getString(c.getColumnIndexOrThrow("ruleId"))
                val tagUuid = c.getString(c.getColumnIndexOrThrow("tagId"))
                val ruleBoxId = ruleBoxIdByUuid[ruleUuid] ?: continue
                val rule = ruleBox.get(ruleBoxId) ?: continue
                val tag = tagBox.query().equal(Tag_.id, tagUuid, io.objectbox.query.QueryBuilder.StringOrder.CASE_SENSITIVE)
                    .build().use { it.findUnique() } ?: continue
                rule.tags.add(tag)
                rule.tags.applyChangesToDb()
            }
        }
    }

    private fun importSettings(db: SQLiteDatabase, store: BoxStore) {
        val box = store.boxFor(SettingsEntry::class.java)
        db.rawQuery("SELECT `key`, `value`, updatedAt, _dirty FROM settings", null).use { c ->
            while (c.moveToNext()) {
                box.put(
                    SettingsEntry(
                        key = c.getString(c.getColumnIndexOrThrow("key")),
                        value = c.getString(c.getColumnIndexOrThrow("value")),
                        updatedAt = c.getLong(c.getColumnIndexOrThrow("updatedAt")),
                        _dirty = c.getInt(c.getColumnIndexOrThrow("_dirty")),
                    ),
                )
            }
        }
    }

    private fun importSyncState(db: SQLiteDatabase, store: BoxStore) {
        val box = store.boxFor(SyncStateEntry::class.java)
        db.rawQuery("SELECT `key`, `value` FROM _sync_state", null).use { c ->
            while (c.moveToNext()) {
                box.put(
                    SyncStateEntry(
                        key = c.getString(c.getColumnIndexOrThrow("key")),
                        value = c.getString(c.getColumnIndexOrThrow("value")),
                    ),
                )
            }
        }
    }

    private fun Cursor.getStringOrNull(column: String): String? =
        getColumnIndexOrThrow(column).let { if (isNull(it)) null else getString(it) }

    private fun Cursor.getLongOrNull(column: String): Long? =
        getColumnIndexOrThrow(column).let { if (isNull(it)) null else getLong(it) }

    private fun Cursor.getIntOrNull(column: String): Int? =
        getColumnIndexOrThrow(column).let { if (isNull(it)) null else getInt(it) }

    private fun Cursor.getDoubleOrNull(column: String): Double? =
        getColumnIndexOrThrow(column).let { if (isNull(it)) null else getDouble(it) }
}
