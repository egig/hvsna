package com.hvsna.app.reminder

/**
 * PendingIntent request codes and NotificationManager ids are a hard Android
 * platform Int constraint — Task.id is now a String uuid, so this derives a
 * stable Int from it. String.hashCode() is spec'd deterministic across runs,
 * so the same task always maps to the same code. A 32-bit hash collision
 * between two different tasks is possible in principle (worst case: one
 * task's reminder/notification gets silently replaced by another's) but
 * vanishingly unlikely at the scale of a single user's task list.
 */
fun taskRequestCode(taskId: String): Int = taskId.hashCode()
