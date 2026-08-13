package com.hvsna.app.reminder

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import com.hvsna.app.MainActivity
import com.hvsna.app.R
import com.hvsna.app.data.Task

private const val CHANNEL_ID = "task_reminders"
const val MARK_DONE_ACTION = "com.hvsna.app.action.MARK_DONE"

object ReminderNotifications {
    private fun ensureChannel(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val manager = context.getSystemService(NotificationManager::class.java)
            if (manager.getNotificationChannel(CHANNEL_ID) == null) {
                manager.createNotificationChannel(
                    NotificationChannel(CHANNEL_ID, "Task reminders", NotificationManager.IMPORTANCE_HIGH),
                )
            }
        }
    }

    fun show(context: Context, task: Task) {
        ensureChannel(context)
        val notificationManagerCompat = NotificationManagerCompat.from(context)
        if (!notificationManagerCompat.areNotificationsEnabled()) return
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
        ) {
            return
        }

        val contentIntent = PendingIntent.getActivity(
            context, task.id, Intent(context, MainActivity::class.java),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
        val markDoneIntent = Intent(context, MarkDoneReceiver::class.java).apply {
            action = MARK_DONE_ACTION
            putExtra(EXTRA_TASK_ID, task.id)
        }
        val markDonePendingIntent = PendingIntent.getBroadcast(
            context, task.id, markDoneIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )

        val notification = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle(task.title)
            .apply { if (task.description.isNotBlank()) setContentText(task.description) }
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_REMINDER)
            .setAutoCancel(true)
            .setContentIntent(contentIntent)
            .addAction(0, "Mark Done", markDonePendingIntent)
            .build()

        notificationManagerCompat.notify(task.id, notification)
    }

    fun cancel(context: Context, taskId: Int) {
        NotificationManagerCompat.from(context).cancel(taskId)
    }
}
