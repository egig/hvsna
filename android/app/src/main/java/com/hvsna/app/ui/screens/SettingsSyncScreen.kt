package com.hvsna.app.ui.screens

import android.app.Activity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.IntentSenderRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LargeTopAppBar
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.vectorResource
import androidx.compose.ui.unit.dp
import com.hvsna.app.R
import com.hvsna.app.drive.DriveSync
import com.hvsna.app.drive.DriveSyncStatus
import com.hvsna.app.i18n.LocalStrings
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.launch
import java.text.DateFormat
import java.util.Date

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsSyncScreen(
    onBack: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val strings = LocalStrings.current
    val context = LocalContext.current
    val driveSync = remember { DriveSync.getInstance(context) }
    val status by driveSync.status.collectAsState()
    val scope = rememberCoroutineScope()
    val scrollBehavior = TopAppBarDefaults.exitUntilCollapsedScrollBehavior()

    var busy by remember { mutableStateOf(false) }
    var message by remember { mutableStateOf<String?>(null) }
    var showTurnOff by remember { mutableStateOf(false) }

    fun connected() {
        if (driveSync.isEnabled) driveSync.requestSync() else driveSync.enable()
    }

    val consentLauncher = rememberLauncherForActivityResult(ActivityResultContracts.StartIntentSenderForResult()) { result ->
        busy = false
        if (result.resultCode != Activity.RESULT_OK) {
            message = strings["sync.connectCancelled"]
            return@rememberLauncherForActivityResult
        }
        runCatching { driveSync.authorization().resultFromIntent(result.data) }
            .onSuccess { authorization ->
                if (authorization.accessToken != null) {
                    connected()
                } else {
                    message = strings["sync.connectCancelled"]
                }
            }
            .onFailure { message = strings.format("sync.connectFailed", it.localizedMessage ?: "") }
    }

    fun connect() {
        message = null
        busy = true
        scope.launch {
            try {
                val result = driveSync.authorization().authorize()
                val pending = result.pendingIntent
                if (result.hasResolution() && pending != null) {
                    consentLauncher.launch(IntentSenderRequest.Builder(pending.intentSender).build())
                    return@launch // busy is cleared by the launcher callback
                }
                connected()
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                message = strings.format("sync.connectFailed", e.localizedMessage ?: "")
            }
            busy = false
        }
    }

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
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(innerPadding)
                .padding(horizontal = 16.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            Text(
                strings["sync.description"],
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )

            if (!status.enabled) {
                Button(onClick = ::connect, enabled = !busy, modifier = Modifier.fillMaxWidth()) {
                    if (busy) ButtonSpinner()
                    Text(if (busy) strings["sync.connecting"] else strings["sync.connect"])
                }
            } else {
                SyncStatusText(status)

                if (status.state == DriveSyncStatus.State.NEEDS_AUTHORIZATION) {
                    Button(onClick = ::connect, enabled = !busy, modifier = Modifier.fillMaxWidth()) {
                        if (busy) ButtonSpinner()
                        Text(if (busy) strings["sync.connecting"] else strings["sync.reconnect"])
                    }
                } else {
                    Button(
                        onClick = {
                            message = null
                            busy = true
                            scope.launch {
                                try {
                                    driveSync.syncNow()
                                } finally {
                                    busy = false
                                }
                            }
                        },
                        enabled = !busy,
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        if (busy) ButtonSpinner()
                        Text(if (busy) strings["sync.syncing"] else strings["sync.now"])
                    }
                }

                OutlinedButton(onClick = { showTurnOff = true }, enabled = !busy, modifier = Modifier.fillMaxWidth()) {
                    Text(strings["sync.turnOff"])
                }
            }

            message?.let {
                Text(it, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
    }

    if (showTurnOff) {
        fun turnOff(deleteRemote: Boolean) {
            showTurnOff = false
            message = null
            busy = true
            scope.launch {
                try {
                    driveSync.disable(deleteRemoteData = deleteRemote)
                } catch (e: CancellationException) {
                    throw e
                } catch (e: Exception) {
                    message = strings.format("sync.turnOffFailed", e.localizedMessage ?: "")
                } finally {
                    busy = false
                }
            }
        }
        AlertDialog(
            onDismissRequest = { showTurnOff = false },
            title = { Text(strings["sync.turnOffTitle"]) },
            text = { Text(strings["sync.turnOffBody"]) },
            confirmButton = {
                Column(horizontalAlignment = Alignment.End) {
                    TextButton(onClick = { turnOff(deleteRemote = false) }) { Text(strings["sync.turnOffKeep"]) }
                    TextButton(onClick = { turnOff(deleteRemote = true) }) {
                        Text(strings["sync.turnOffDelete"], color = MaterialTheme.colorScheme.error)
                    }
                    TextButton(onClick = { showTurnOff = false }) { Text(strings["common.cancel"]) }
                }
            },
        )
    }
}

@Composable
private fun SyncStatusText(status: DriveSyncStatus) {
    val strings = LocalStrings.current
    val lines = buildList {
        add(
            status.lastSyncedAt
                ?.let { strings.format("sync.lastSynced", DateFormat.getDateTimeInstance(DateFormat.MEDIUM, DateFormat.SHORT).format(Date(it))) }
                ?: strings["sync.neverSynced"],
        )
        when (status.state) {
            DriveSyncStatus.State.NEEDS_AUTHORIZATION -> add(strings["sync.needsAuthorization"])
            DriveSyncStatus.State.FAILED -> add(strings.format("sync.failed", status.errorMessage ?: ""))
            else -> Unit
        }
        if (status.blockingDevices.isNotEmpty()) add(strings.format("sync.blocked", status.blockingDevices.joinToString(", ")))
        if (status.skippedRecords > 0) add(strings.format("sync.skipped", status.skippedRecords))
    }
    lines.forEach { line ->
        Text(line, style = MaterialTheme.typography.bodyMedium)
    }
}

@Composable
private fun ButtonSpinner() {
    CircularProgressIndicator(
        modifier = Modifier.padding(end = 8.dp),
        strokeWidth = 2.dp,
        color = MaterialTheme.colorScheme.onPrimary,
    )
}
