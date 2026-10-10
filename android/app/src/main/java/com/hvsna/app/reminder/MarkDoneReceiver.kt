package com.hvsna.app.reminder

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.hvsna.app.data.ObjectBoxStore
import com.hvsna.app.data.SyncClock
import com.hvsna.app.data.TaskStore
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class MarkDoneReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val taskId = intent.getStringExtra(EXTRA_TASK_ID) ?: return

        val pendingResult = goAsync()
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val dao = TaskStore(ObjectBoxStore.getInstance(context), SyncClock.getInstance(context))
                val task = dao.getTaskById(taskId)
                if (task != null && task.isDone == 0) {
                    val now = System.currentTimeMillis()
                    dao.update(task.copy(isDone = 1, completedTime = now, updatedAt = now))
                }
                ReminderNotifications.cancel(context, taskId)
            } finally {
                pendingResult.finish()
            }
        }
    }
}
