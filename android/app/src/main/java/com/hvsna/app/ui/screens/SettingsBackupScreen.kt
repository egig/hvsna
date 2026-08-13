package com.hvsna.app.ui.screens

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
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
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.compose.ui.unit.dp
import com.hvsna.app.backup.BackupFileService
import compose.icons.TablerIcons
import compose.icons.tablericons.ArrowLeft
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsBackupScreen(
    backupFileService: BackupFileService,
    onBack: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val scope = rememberCoroutineScope()
    val scrollBehavior = TopAppBarDefaults.exitUntilCollapsedScrollBehavior()

    var isExporting by remember { mutableStateOf(false) }
    var isImporting by remember { mutableStateOf(false) }
    var dataMessage by remember { mutableStateOf<String?>(null) }
    var showImportOptions by remember { mutableStateOf(false) }
    var pendingImportUri by remember { mutableStateOf<Uri?>(null) }

    val exportLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.CreateDocument("application/json")
    ) { uri ->
        if (uri != null) {
            isExporting = true
            scope.launch {
                val result = backupFileService.exportTo(uri)
                dataMessage = result.fold(
                    onSuccess = { "Backup exported" },
                    onFailure = { "Export failed: ${it.localizedMessage}" },
                )
                isExporting = false
            }
        }
    }

    val importLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.OpenDocument()
    ) { uri ->
        if (uri != null) {
            pendingImportUri = uri
            showImportOptions = true
        }
    }

    fun runImport(mode: suspend (Uri) -> Result<Unit>, uri: Uri) {
        isImporting = true
        scope.launch {
            val result = mode(uri)
            dataMessage = result.fold(
                onSuccess = { "Backup imported" },
                onFailure = { "Import failed: ${it.localizedMessage}" },
            )
            isImporting = false
        }
    }

    Scaffold(
        modifier = modifier
            .fillMaxSize()
            .nestedScroll(scrollBehavior.nestedScrollConnection),
        topBar = {
            LargeTopAppBar(
                title = { Text("Backup & Restore") },
                scrollBehavior = scrollBehavior,
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(TablerIcons.ArrowLeft, contentDescription = "Back")
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
                "Export your tasks to a file, or restore from a previous export.",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Button(
                onClick = {
                    dataMessage = null
                    exportLauncher.launch("hvsna-backup-${System.currentTimeMillis()}.json")
                },
                enabled = !isExporting && !isImporting,
                modifier = Modifier.fillMaxWidth(),
            ) {
                if (isExporting) {
                    CircularProgressIndicator(
                        modifier = Modifier.padding(end = 8.dp),
                        strokeWidth = 2.dp,
                        color = MaterialTheme.colorScheme.onPrimary,
                    )
                }
                Text(if (isExporting) "Exporting…" else "Export data")
            }
            Button(
                onClick = {
                    dataMessage = null
                    importLauncher.launch(arrayOf("application/json"))
                },
                enabled = !isExporting && !isImporting,
                modifier = Modifier.fillMaxWidth(),
            ) {
                if (isImporting) {
                    CircularProgressIndicator(
                        modifier = Modifier.padding(end = 8.dp),
                        strokeWidth = 2.dp,
                        color = MaterialTheme.colorScheme.onPrimary,
                    )
                }
                Text(if (isImporting) "Importing…" else "Import data")
            }
            dataMessage?.let {
                Text(it, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }

            if (showImportOptions) {
                AlertDialog(
                    onDismissRequest = {
                        showImportOptions = false
                        pendingImportUri = null
                    },
                    title = { Text("Import backup") },
                    text = {
                        Text(
                            "Replace deletes all current tasks, tags, and recurring reminders and " +
                                "substitutes this backup's contents. Merge keeps your current data and " +
                                "adds this backup's tasks, tags, and recurring reminders alongside it."
                        )
                    },
                    confirmButton = {
                        Row {
                            TextButton(onClick = {
                                val uri = pendingImportUri
                                showImportOptions = false
                                pendingImportUri = null
                                if (uri != null) runImport(backupFileService::importMerging, uri)
                            }) { Text("Merge") }
                            TextButton(onClick = {
                                val uri = pendingImportUri
                                showImportOptions = false
                                pendingImportUri = null
                                if (uri != null) runImport(backupFileService::importReplacing, uri)
                            }) { Text("Replace") }
                        }
                    },
                    dismissButton = {
                        TextButton(onClick = {
                            showImportOptions = false
                            pendingImportUri = null
                        }) { Text("Cancel") }
                    },
                )
            }
        }
    }
}
