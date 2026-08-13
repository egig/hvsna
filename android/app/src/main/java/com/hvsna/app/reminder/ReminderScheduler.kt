package com.hvsna.app.reminder

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import com.hvsna.app.data.Task
import com.hvsna.app.data.reminderFireTimeOrNull

const val REMINDER_ACTION = "com.hvsna.app.action.TASK_REMINDER"
const val EXTRA_TASK_ID = "task_id"

class ReminderScheduler(private val context: Context) {
    private val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager

    private fun pendingIntent(taskId: String): PendingIntent {
        val intent = Intent(context, ReminderReceiver::class.java).apply {
            action = REMINDER_ACTION
            putExtra(EXTRA_TASK_ID, taskId)
        }
        return PendingIntent.getBroadcast(
            context, taskRequestCode(taskId), intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
    }

    fun canScheduleExactAlarms(): Boolean =
        Build.VERSION.SDK_INT < Build.VERSION_CODES.S || alarmManager.canScheduleExactAlarms()

    fun sync(task: Task, remindersEnabled: Boolean) {
        val pendingIntent = pendingIntent(task.id)
        alarmManager.cancel(pendingIntent)

        val fireAt = reminderFireTimeOrNull(task, remindersEnabled, System.currentTimeMillis()) ?: return
        if (!canScheduleExactAlarms()) return

        alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, fireAt, pendingIntent)
    }

    fun cancel(taskId: String) {
        alarmManager.cancel(pendingIntent(taskId))
    }
}
