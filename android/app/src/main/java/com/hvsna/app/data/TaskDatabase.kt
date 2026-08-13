package com.hvsna.app.data

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import com.hvsna.app.data.migrations.MIGRATION_1_2
import com.hvsna.app.data.migrations.MIGRATION_2_3

@Database(
    entities = [Task::class, Tag::class, TaskTagCrossRef::class, RecurrenceRule::class, SettingsEntry::class],
    version = 3,
    exportSchema = true,
)
abstract class TaskDatabase : RoomDatabase() {
    abstract fun taskDao(): TaskDao
    abstract fun settingsDao(): SettingsDao

    companion object {
        @Volatile private var instance: TaskDatabase? = null

        fun getInstance(context: Context): TaskDatabase =
            instance ?: synchronized(this) {
                instance ?: Room.databaseBuilder(
                    context.applicationContext,
                    TaskDatabase::class.java,
                    "task_db",
                ).addMigrations(MIGRATION_1_2, MIGRATION_2_3)
                    .build().also { instance = it }
            }
    }
}
