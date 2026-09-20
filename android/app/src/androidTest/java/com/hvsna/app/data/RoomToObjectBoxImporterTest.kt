package com.hvsna.app.data

import android.database.sqlite.SQLiteDatabase
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import io.objectbox.BoxStore
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import java.io.File

/**
 * Pins the one migration path that still matters: an existing install's
 * legacy SQLite file getting faithfully carried over into a fresh
 * ObjectBox store (see RoomToObjectBoxImporter's doc comment for why this
 * can't just be skipped for a "fresh" schema instead).
 */
@RunWith(AndroidJUnit4::class)
class RoomToObjectBoxImporterTest {
    private lateinit var dbFile: File
    private lateinit var storeDir: File
    private lateinit var store: BoxStore

    @Before
    fun setUp() {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        dbFile = context.getDatabasePath("room_fixture_v5.db")
        dbFile.delete()
        storeDir = File(context.filesDir, "objectbox/importer-test-${System.nanoTime()}")
        store = MyObjectBox.builder()
            .androidContext(context)
            .directory(storeDir)
            .build()
    }

    @After
    fun tearDown() {
        store.close()
        storeDir.deleteRecursively()
        dbFile.delete()
    }

    private fun createFixtureDb(): SQLiteDatabase {
        val db = SQLiteDatabase.openOrCreateDatabase(dbFile, null)
        db.execSQL(
            """CREATE TABLE Task (
                id TEXT NOT NULL PRIMARY KEY, title TEXT NOT NULL, description TEXT NOT NULL,
                scheduledTime INTEGER, isDone INTEGER NOT NULL, atTime TEXT, completedTime INTEGER,
                recurringTaskId TEXT, recurringType TEXT, recurringInterval INTEGER,
                lat REAL, lng REAL, timezone TEXT, hijriDateOffset INTEGER,
                reminderEnabled INTEGER NOT NULL, reminderOffsetMinutes INTEGER NOT NULL,
                createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL, deletedAt INTEGER, _dirty INTEGER NOT NULL
            )""",
        )
        db.execSQL(
            """CREATE TABLE Tag (
                id TEXT NOT NULL PRIMARY KEY, name TEXT NOT NULL, color INTEGER NOT NULL,
                createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL, deletedAt INTEGER, _dirty INTEGER NOT NULL
            )""",
        )
        db.execSQL(
            """CREATE TABLE recurrence_rule (
                id TEXT NOT NULL PRIMARY KEY, title TEXT NOT NULL, description TEXT NOT NULL,
                recurringType TEXT NOT NULL, recurringInterval INTEGER NOT NULL, baseDateEpoch INTEGER NOT NULL,
                atTime TEXT, lat REAL, lng REAL, timezone TEXT, hijriDateOffset INTEGER,
                recurringEnd TEXT, recurringEndEpoch INTEGER, recurringEndOccurrences INTEGER,
                useGregorian INTEGER NOT NULL, occurrenceExceptions TEXT,
                reminderEnabled INTEGER NOT NULL, reminderOffsetMinutes INTEGER NOT NULL,
                createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL, deletedAt INTEGER, _dirty INTEGER NOT NULL
            )""",
        )
        db.execSQL("CREATE TABLE task_tag_cross_ref (taskId TEXT NOT NULL, tagId TEXT NOT NULL, PRIMARY KEY(taskId, tagId))")
        db.execSQL("CREATE TABLE recurrence_rule_tag_cross_ref (ruleId TEXT NOT NULL, tagId TEXT NOT NULL, PRIMARY KEY(ruleId, tagId))")
        db.execSQL("CREATE TABLE settings (`key` TEXT NOT NULL PRIMARY KEY, `value` TEXT NOT NULL, updatedAt INTEGER NOT NULL, _dirty INTEGER NOT NULL)")
        db.execSQL("CREATE TABLE _sync_state (`key` TEXT NOT NULL PRIMARY KEY, `value` TEXT NOT NULL)")

        db.execSQL(
            """INSERT INTO recurrence_rule
               (id, title, description, recurringType, recurringInterval, baseDateEpoch, atTime, lat, lng, timezone,
                hijriDateOffset, recurringEnd, recurringEndEpoch, recurringEndOccurrences, useGregorian, occurrenceExceptions,
                reminderEnabled, reminderOffsetMinutes, createdAt, updatedAt, deletedAt, _dirty)
               VALUES ('rule-1', 'Read Quran', '', 'daily', 1, 1700000000000, '05:00', NULL, NULL, NULL,
                NULL, 'never', NULL, NULL, 0, NULL, 1, 10, 1000, 2000, NULL, 1)""",
        )
        db.execSQL(
            """INSERT INTO Tag (id, name, color, createdAt, updatedAt, deletedAt, _dirty)
               VALUES ('tag-1', 'Worship', 4287349439, 1000, 2000, NULL, 1)""",
        )
        db.execSQL(
            """INSERT INTO Task
               (id, title, description, scheduledTime, isDone, atTime, completedTime, recurringTaskId, recurringType,
                recurringInterval, lat, lng, timezone, hijriDateOffset, reminderEnabled, reminderOffsetMinutes,
                createdAt, updatedAt, deletedAt, _dirty)
               VALUES ('task-1', 'Buy groceries', 'Milk and eggs', 1700000000000, 0, '09:30', NULL, 'rule-1', 'daily',
                1, 21.4, 39.8, 'Asia/Riyadh', 5, 1, 15, 1000, 2000, NULL, 1)""",
        )
        db.execSQL("INSERT INTO task_tag_cross_ref (taskId, tagId) VALUES ('task-1', 'tag-1')")
        db.execSQL("INSERT INTO recurrence_rule_tag_cross_ref (ruleId, tagId) VALUES ('rule-1', 'tag-1')")
        db.execSQL(
            """INSERT INTO settings (`key`, `value`, updatedAt, _dirty)
               VALUES ('location', '{"lat":21.4,"lng":39.8}', 3000, 1)""",
        )
        db.execSQL("INSERT INTO _sync_state (`key`, `value`) VALUES ('sync_cursor_tasks', '42')")
        return db
    }

    @Test
    fun importsEveryTableIntoObjectBox() {
        createFixtureDb().close()

        RoomToObjectBoxImporter.importFrom(dbFile.path, store)

        val task = store.boxFor(Task::class.java).all.single()
        assertEquals("Buy groceries", task.title)
        assertEquals("Milk and eggs", task.description)
        assertEquals(1700000000000L, task.scheduledTime)
        assertEquals("rule-1", task.recurringTaskId)
        assertEquals(21.4, task.lat!!, 0.0001)
        assertEquals(listOf("tag-1"), task.tags.map { it.id })

        val tag = store.boxFor(Tag::class.java).all.single()
        assertEquals("Worship", tag.name)
        assertEquals(4287349439L, tag.color)

        val rule = store.boxFor(RecurrenceRule::class.java).all.single()
        assertEquals("Read Quran", rule.title)
        assertEquals("daily", rule.recurringType)
        assertEquals(listOf("tag-1"), rule.tags.map { it.id })

        val setting = store.boxFor(SettingsEntry::class.java).all.single()
        assertEquals("location", setting.key)
        assertTrue(setting.value.contains("21.4"))

        val syncState = store.boxFor(SyncStateEntry::class.java).all.single()
        assertEquals("sync_cursor_tasks", syncState.key)
        assertEquals("42", syncState.value)
    }

    @Test
    fun softDeletedRowsCarryOverAsTombstones() {
        val db = createFixtureDb()
        db.execSQL("UPDATE Task SET deletedAt = 5000 WHERE id = 'task-1'")
        db.close()

        RoomToObjectBoxImporter.importFrom(dbFile.path, store)

        val task = store.boxFor(Task::class.java).all.single()
        assertEquals(5000L, task.deletedAt)
        assertNull(store.boxFor(Task::class.java).all.firstOrNull { it.deletedAt == null })
    }
}
