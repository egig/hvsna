package com.hvsna.app.reminder

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.hvsna.app.data.ObjectBoxStore
import com.hvsna.app.data.SettingsRepository
import com.hvsna.app.data.SettingsStore
import com.hvsna.app.data.SyncClock
import com.hvsna.app.data.TaskRepository
import com.hvsna.app.data.TaskStore
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Intent.ACTION_BOOT_COMPLETED) return

        val pendingResult = goAsync()
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val store = ObjectBoxStore.getInstance(context)
                val settingsRepository = SettingsRepository(context, SettingsStore(store, SyncClock.getInstance(context)))
                val remindersEnabled = settingsRepository.settings.first().remindersEnabled
                if (!remindersEnabled) return@launch

                val repository = TaskRepository(TaskStore(store, SyncClock.getInstance(context)), context)
                val scheduler = ReminderScheduler(context)
                repository.getAllUndoneReminderEnabledTasks().forEach { task ->
                    scheduler.sync(task, true)
                }
            } finally {
                pendingResult.finish()
            }
        }
    }
}
