package com.hvsna.app.ui.screens

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LargeTopAppBar
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.compose.ui.unit.dp
import com.hvsna.app.data.AppSettings
import com.hvsna.app.data.SettingsRepository
import com.hvsna.app.data.combinedDateLabel
import com.hvsna.app.sync.SyncManager
import com.hvsna.app.ui.AuthViewModel
import java.text.SimpleDateFormat
import java.util.Date
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.vectorResource
import com.hvsna.app.R
import com.hvsna.app.auth.canSync
import com.hvsna.app.auth.needsSyncPlan
import com.hvsna.app.i18n.LocalStrings

/** Android has no checkout of its own — the Sync plan is bought on the web app's subscription page. */
private const val SUBSCRIPTION_URL = "https://app.hvsna.com/settings/subscription"

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsSyncScreen(
    syncManager: SyncManager,
    authViewModel: AuthViewModel,
    settingsRepository: SettingsRepository,
    onBack: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val strings = LocalStrings.current
    val settings by settingsRepository.settings.collectAsState(initial = AppSettings())
    val lastSyncedTimeFormat = remember(strings.locale) { SimpleDateFormat("h:mm a", strings.locale) }
    val authState by authViewModel.state.collectAsState()
    val isSyncing by syncManager.isSyncing.collectAsState()
    val isManualSyncing by syncManager.isManualSyncing.collectAsState()
    val lastSyncedAt by syncManager.lastSyncedAt.collectAsState()
    val isSignedIn = authState.user != null
    val canSync = authState.user?.canSync == true
    val needsSyncPlan = authState.user?.needsSyncPlan == true
    val context = LocalContext.current

    // Re-read /me on open so a Sync plan bought (on the web) since sign-in takes effect here.
    LaunchedEffect(Unit) { authViewModel.refreshUser() }

    val scrollBehavior = TopAppBarDefaults.exitUntilCollapsedScrollBehavior()

    Scaffold(
        modifier = modifier
            .fillMaxSize()
            .nestedScroll(scrollBehavior.nestedScrollConnection),
        topBar = {
            LargeTopAppBar(
                title = { Text(strings["sync.title"]) },
                scrollBehavior = scrollBehavior,
                colors = TopAppBarDefaults.largeTopAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface,
                    scrolledContainerColor = MaterialTheme.colorScheme.surface,
                ),
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(ImageVector.vectorResource(id = R.drawable.ic_arrow_left), contentDescription = strings["common.back"])
                    }
                },
            )
        },
    ) { innerPadding ->
        PullToRefreshBox(
            isRefreshing = isManualSyncing,
            onRefresh = { if (canSync) syncManager.requestSync(manual = true) },
            modifier = Modifier.fillMaxSize(),
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(innerPadding)
                    .padding(horizontal = 16.dp, vertical = 24.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp),
            ) {
                if (!isSignedIn) {
                    Text(
                        strings["sync.signInPrompt"],
                        style = MaterialTheme.typography.bodyLarge,
                    )
                } else if (needsSyncPlan) {
                    Text(
                        strings["sync.planRequiredPrompt"],
                        style = MaterialTheme.typography.bodyLarge,
                    )
                    Button(
                        onClick = {
                            context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(SUBSCRIPTION_URL)))
                        },
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Text(strings["sync.viewPlan"])
                    }
                } else if (!canSync) {
                    Text(
                        strings["sync.verifyEmailPrompt"],
                        style = MaterialTheme.typography.bodyLarge,
                    )
                } else {
                    Icon(
                        ImageVector.vectorResource(id = R.drawable.ic_cloud),
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.padding(bottom = 4.dp),
                    )
                    Text(
                        remember(lastSyncedAt, strings, settings.hijriMonthOffsets) {
                            lastSyncedAt?.let {
                                val combinedDate = combinedDateLabel(it, settings.hijriMonthOffsets, strings = strings, includeYear = false)
                                val time = lastSyncedTimeFormat.format(Date(it))
                                strings.format("sync.lastSynced", "$combinedDate, $time")
                            } ?: strings["sync.notSyncedYet"]
                        },
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    Button(
                        onClick = { syncManager.requestSync(manual = true) },
                        enabled = !isSyncing,
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        if (isSyncing) {
                            CircularProgressIndicator(
                                modifier = Modifier.padding(end = 8.dp),
                                strokeWidth = 2.dp,
                                color = MaterialTheme.colorScheme.onPrimary,
                            )
                        }
                        Text(if (isSyncing) strings["sync.syncing"] else strings["sync.syncNow"])
                    }
                    Text(
                        strings["sync.autoSyncNote"],
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
        }
    }
}
