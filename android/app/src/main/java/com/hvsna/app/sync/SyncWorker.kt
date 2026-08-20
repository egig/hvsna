package com.hvsna.app.sync

import android.content.Context
import androidx.work.Constraints
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.ExistingWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import com.hvsna.app.auth.AuthApi
import com.hvsna.app.auth.AuthService
import com.hvsna.app.auth.SessionRepository
import com.hvsna.app.auth.TokenStore
import com.hvsna.app.data.TaskDatabase
import okhttp3.OkHttpClient
import java.util.concurrent.TimeUnit

/**
 * Periodic background sync (15-minute floor, the platform minimum for
 * PeriodicWorkRequest) — additive to the manual/reconnect/sign-in triggers
 * in SyncManager, not a replacement. Constructs its own short-lived
 * AuthService/TokenStore per run (consistent with how this app already
 * builds auth dependencies fresh per call site — see MarkDoneReceiver/
 * BootReceiver — rather than sharing the running Activity's singletons,
 * which WorkManager's default reflection-based worker instantiation can't
 * reach anyway without a custom WorkerFactory).
 */
class SyncWorker(context: Context, params: WorkerParameters) : CoroutineWorker(context, params) {
    override suspend fun doWork(): Result = try {
        val okHttpClient = OkHttpClient()
        val tokenStore = TokenStore()
        val authService = AuthService(AuthApi(okHttpClient), tokenStore, SessionRepository(applicationContext))
        authService.initialize()
        if (!authService.isAuthenticated()) {
            Result.success()
        } else {
            val db = TaskDatabase.getInstance(applicationContext)
            val engine = SyncEngine(
                SyncRepository(db.taskDao(), db.settingsDao()),
                SyncApi(okHttpClient, authService, tokenStore),
                CursorStore(db.syncStateDao()),
            )
            engine.fullSync()
            Result.success()
        }
    } catch (_: Exception) {
        Result.retry()
    }

    companion object {
        private const val WORK_NAME = "sync_periodic"
        private const val ONE_TIME_WORK_NAME = "sync_once"
        private const val INTERVAL_MINUTES = 15L

        /** Idempotent — safe to call on every app startup; KEEP preserves the existing schedule/backoff if already enqueued. */
        fun schedule(context: Context) {
            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build()
            val request = PeriodicWorkRequestBuilder<SyncWorker>(INTERVAL_MINUTES, TimeUnit.MINUTES)
                .setConstraints(constraints)
                .build()
            WorkManager.getInstance(context)
                .enqueueUniquePeriodicWork(WORK_NAME, ExistingPeriodicWorkPolicy.KEEP, request)
        }

        /** Call on sign-out — periodic sync shouldn't keep running for a signed-out user. */
        fun cancel(context: Context) {
            WorkManager.getInstance(context).cancelUniqueWork(WORK_NAME)
        }

        /**
         * One-off sync request for write paths with no live SyncManager to call (e.g.
         * MarkDoneReceiver, a short-lived BroadcastReceiver). REPLACE so a burst of quick
         * receiver firings collapses to the latest enqueue rather than stacking; the
         * NetworkType.CONNECTED constraint holds the job until connectivity returns, which
         * covers "skip while offline" even if the process isn't alive when it does.
         */
        fun enqueueOnce(context: Context) {
            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build()
            val request = OneTimeWorkRequestBuilder<SyncWorker>()
                .setConstraints(constraints)
                .build()
            WorkManager.getInstance(context)
                .enqueueUniqueWork(ONE_TIME_WORK_NAME, ExistingWorkPolicy.REPLACE, request)
        }
    }
}
