package com.hvsna.app.reminder

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.hvsna.app.data.TaskDatabase
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class ReminderReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val taskId = intent.getIntExtra(EXTRA_TASK_ID, -1)
        if (taskId == -1) return

        val pendingResult = goAsync()
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val dao = TaskDatabase.getInstance(context).taskDao()
                val task = dao.getTaskById(taskId)
                if (task != null && task.isDone == 0 && task.reminderEnabled) {
                    ReminderNotifications.show(context, task)
                }
            } finally {
                pendingResult.finish()
            }
        }
    }
}
