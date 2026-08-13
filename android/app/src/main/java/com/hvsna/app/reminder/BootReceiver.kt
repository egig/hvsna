package com.hvsna.app.reminder

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.hvsna.app.data.SettingsRepository
import com.hvsna.app.data.TaskDatabase
import com.hvsna.app.data.TaskRepository
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
                val settingsRepository = SettingsRepository(context, TaskDatabase.getInstance(context).settingsDao())
                val remindersEnabled = settingsRepository.settings.first().remindersEnabled
                if (!remindersEnabled) return@launch

                val repository = TaskRepository(TaskDatabase.getInstance(context).taskDao(), context)
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
