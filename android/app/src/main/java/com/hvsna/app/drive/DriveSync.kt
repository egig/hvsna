package com.hvsna.app.drive

import android.content.Context
import android.os.Build
import androidx.work.BackoffPolicy
import androidx.work.Constraints
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.ExistingWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import com.hvsna.app.data.ObjectBoxStore
import com.hvsna.app.data.RecurrenceRule
import com.hvsna.app.data.SettingsEntry
import com.hvsna.app.data.SettingsRepository
import com.hvsna.app.data.SettingsStore
import com.hvsna.app.data.SyncClock
import com.hvsna.app.data.SyncLocalStore
import com.hvsna.app.data.Tag
import com.hvsna.app.data.Task
import com.hvsna.app.data.TaskStore
import com.hvsna.app.reminder.ReminderScheduler
import com.hvsna.app.sync.DriveClient
import com.hvsna.app.sync.SyncEngine
import com.hvsna.app.sync.SyncOutcome
import io.objectbox.reactive.DataSubscription
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import java.util.concurrent.TimeUnit

/**
 * Process-wide entry point for Google Drive sync: turning it on and off,
 * running a cycle, scheduling background cycles, and exposing [status] to
 * the Sync screen. Cycles run in [DriveSyncWorker] (so they survive the app
 * closing and wait for a network), triggered when the app comes to the
 * foreground, a few seconds after local edits, hourly, and on "Sync now".
 */
class DriveSync private constructor(private val context: Context) {
    private val prefs = DriveSyncPrefs(context)
    private val auth = DriveAuth(context)
    private val boxStore = ObjectBoxStore.getInstance(context)
    private val clock = SyncClock.getInstance(context)

    private val engine = SyncEngine(
        remote = DriveClient(accessToken = auth::accessToken, invalidateToken = auth::clearToken),
        local = SyncLocalStore(boxStore, clock),
        bookkeeping = prefs,
        deviceId = SyncClock.deviceId(context),
        deviceName = listOf(Build.MANUFACTURER, Build.MODEL).filter { !it.isNullOrBlank() }.joinToString(" ").ifBlank { "Android" },
    )

    private val _status = MutableStateFlow(prefs.status())
    val status: StateFlow<DriveSyncStatus> = _status.asStateFlow()

    @Volatile private var localChanges: DataSubscription? = null

    val isEnabled: Boolean get() = prefs.enabled

    fun authorization() = auth

    /** Call after the user granted Drive access in the UI. */
    fun enable() {
        prefs.enabled = true
        publish()
        schedulePeriodic()
        requestSync()
    }

    /**
     * Stops syncing on this device. With [deleteRemoteData], first deletes
     * every Hvsna file in the user's Drive app folder (all devices' copies);
     * other devices that still have sync on will upload theirs again. Local
     * data is never touched. Throws if the deletion fails, leaving sync on.
     */
    suspend fun disable(deleteRemoteData: Boolean) {
        // Cancel queued cycles first so none re-uploads between the deletion and turning off.
        val work = WorkManager.getInstance(context)
        work.cancelUniqueWork(PERIODIC_WORK)
        work.cancelUniqueWork(ONE_TIME_WORK)
        if (deleteRemoteData) {
            try {
                engine.deleteRemoteData()
            } catch (e: Exception) {
                schedulePeriodic()
                throw e
            }
        }
        prefs.reset()
        publish()
    }

    /**
     * Queues a cycle, replacing a pending one, which debounces bursts of
     * edits. Replacing can also cancel a cycle that is running, including
     * one whose own merge triggered [watchLocalChanges]; that is safe
     * because every step of a cycle is idempotent (the merge commits in one
     * transaction, and bookkeeping is written only after the step it
     * records), so the replacement redoes whatever was cut short.
     */
    fun requestSync(delaySeconds: Long = 0) {
        if (!prefs.enabled) return
        val request = OneTimeWorkRequestBuilder<DriveSyncWorker>()
            .setConstraints(networkConstraint())
            .setInitialDelay(delaySeconds, TimeUnit.SECONDS)
            .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 30, TimeUnit.SECONDS)
            .build()
        WorkManager.getInstance(context).enqueueUniqueWork(ONE_TIME_WORK, ExistingWorkPolicy.REPLACE, request)
    }

    /** Requests a cycle a few seconds after any local write to a synced entity. Idempotent; lives as long as the process. */
    fun watchLocalChanges() {
        if (localChanges != null) return
        synchronized(this) {
            if (localChanges != null) return
            localChanges = boxStore.subscribe()
                .onlyChanges()
                .observer { changedClass ->
                    if (changedClass in SYNCED_CLASSES) requestSync(EDIT_DEBOUNCE_SECONDS)
                }
        }
    }

    /** Runs one cycle now (on the caller's coroutine) and records its outcome. */
    suspend fun syncNow(): SyncOutcome? {
        if (!prefs.enabled) return null
        val outcome = engine.run()
        val now = System.currentTimeMillis()
        when (outcome) {
            is SyncOutcome.Synced -> {
                prefs.recordOutcome(DriveSyncStatus.State.OK, now, null, outcome.blockingDevices, outcome.skippedRecords)
                if (outcome.appliedRecords > 0) refreshReminders(outcome)
            }
            SyncOutcome.NeedsAuthorization -> prefs.recordOutcome(DriveSyncStatus.State.NEEDS_AUTHORIZATION, null)
            is SyncOutcome.Failed -> prefs.recordOutcome(
                DriveSyncStatus.State.FAILED, null, outcome.error.message ?: outcome.error.javaClass.simpleName,
            )
        }
        publish()
        return outcome
    }

    private fun schedulePeriodic() {
        val request = PeriodicWorkRequestBuilder<DriveSyncWorker>(PERIODIC_HOURS, TimeUnit.HOURS)
            .setConstraints(networkConstraint())
            .build()
        WorkManager.getInstance(context).enqueueUniquePeriodicWork(PERIODIC_WORK, ExistingPeriodicWorkPolicy.KEEP, request)
    }

    private fun networkConstraint() = Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build()

    /** Merged rows can add, move, complete or delete reminders, and synced prayer settings move prayer-anchored ones. */
    private suspend fun refreshReminders(outcome: SyncOutcome.Synced) {
        val taskStore = TaskStore(boxStore, clock)
        val remindersEnabled = SettingsRepository(context, SettingsStore(boxStore, clock)).settings.first().remindersEnabled
        val scheduler = ReminderScheduler(context)
        outcome.changedTaskIds.forEach { id ->
            val task = taskStore.getTaskById(id)
            if (task == null) scheduler.cancel(id) else scheduler.sync(task, remindersEnabled)
        }
        if (outcome.appliedRecords > outcome.changedTaskIds.size) {
            taskStore.getAllUndoneReminderEnabledTasks().forEach { scheduler.sync(it, remindersEnabled) }
        }
    }

    private fun publish() {
        _status.value = prefs.status()
    }

    companion object {
        private const val PERIODIC_WORK = "drive_sync_periodic"
        private const val ONE_TIME_WORK = "drive_sync_once"
        private const val PERIODIC_HOURS = 1L
        private const val EDIT_DEBOUNCE_SECONDS = 5L
        private val SYNCED_CLASSES = setOf<Class<*>>(Task::class.java, Tag::class.java, RecurrenceRule::class.java, SettingsEntry::class.java)

        @Volatile private var instance: DriveSync? = null

        fun getInstance(context: Context): DriveSync =
            instance ?: synchronized(this) {
                instance ?: DriveSync(context.applicationContext).also { instance = it }
            }
    }
}

class DriveSyncWorker(context: Context, params: WorkerParameters) : CoroutineWorker(context, params) {
    override suspend fun doWork(): Result =
        when (DriveSync.getInstance(applicationContext).syncNow()) {
            is SyncOutcome.Failed -> if (runAttemptCount < MAX_RETRIES) Result.retry() else Result.failure()
            else -> Result.success()
        }

    private companion object {
        const val MAX_RETRIES = 5
    }
}
