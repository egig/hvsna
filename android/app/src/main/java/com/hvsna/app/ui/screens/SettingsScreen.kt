package com.hvsna.app.ui.screens

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LargeTopAppBar
import androidx.compose.material3.ListItem
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.compose.ui.unit.dp
import com.hvsna.app.backup.BackupFileService
import com.hvsna.app.data.LocationRepository
import com.hvsna.app.data.SettingsRepository
import com.hvsna.app.sync.SyncManager
import com.hvsna.app.ui.AuthViewModel
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.vectorResource
import com.hvsna.app.R

private enum class SettingsSubScreen {
    NONE, LOGIN, BACKUP, SYNC, LOCATION, PRAYER_TIME, HIJRI_MONTH_OFFSETS, REMINDERS, ABOUT
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    settingsRepository: SettingsRepository,
    locationRepository: LocationRepository,
    backupFileService: BackupFileService,
    authViewModel: AuthViewModel,
    syncManager: SyncManager,
    onBack: () -> Unit,
    modifier: Modifier = Modifier,
) {
    var subScreen by remember { mutableStateOf(SettingsSubScreen.NONE) }

    when (subScreen) {
        SettingsSubScreen.LOGIN -> {
            SettingsLoginScreen(viewModel = authViewModel, onBack = { subScreen = SettingsSubScreen.NONE }, modifier = modifier)
            return
        }
        SettingsSubScreen.BACKUP -> {
            SettingsBackupScreen(backupFileService = backupFileService, onBack = { subScreen = SettingsSubScreen.NONE }, modifier = modifier)
            return
        }
        SettingsSubScreen.SYNC -> {
            SettingsSyncScreen(syncManager = syncManager, authViewModel = authViewModel, onBack = { subScreen = SettingsSubScreen.NONE }, modifier = modifier)
            return
        }
        SettingsSubScreen.LOCATION -> {
            SettingsLocationScreen(
                settingsRepository = settingsRepository,
                locationRepository = locationRepository,
                onBack = { subScreen = SettingsSubScreen.NONE },
                modifier = modifier,
            )
            return
        }
        SettingsSubScreen.PRAYER_TIME -> {
            SettingsPrayerTimeScreen(settingsRepository = settingsRepository, onBack = { subScreen = SettingsSubScreen.NONE }, modifier = modifier)
            return
        }
        SettingsSubScreen.HIJRI_MONTH_OFFSETS -> {
            SettingsHijriMonthOffsetsScreen(settingsRepository = settingsRepository, onBack = { subScreen = SettingsSubScreen.NONE }, modifier = modifier)
            return
        }
        SettingsSubScreen.REMINDERS -> {
            SettingsRemindersScreen(settingsRepository = settingsRepository, onBack = { subScreen = SettingsSubScreen.NONE }, modifier = modifier)
            return
        }
        SettingsSubScreen.ABOUT -> {
            SettingsAboutScreen(onBack = { subScreen = SettingsSubScreen.NONE }, modifier = modifier)
            return
        }
        SettingsSubScreen.NONE -> Unit
    }

    val scrollBehavior = TopAppBarDefaults.exitUntilCollapsedScrollBehavior()

    Scaffold(
        modifier = modifier
            .fillMaxSize()
            .nestedScroll(scrollBehavior.nestedScrollConnection),
        topBar = {
            LargeTopAppBar(
                title = { Text("Settings") },
                scrollBehavior = scrollBehavior,
                colors = TopAppBarDefaults.largeTopAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface,
                    scrolledContainerColor = MaterialTheme.colorScheme.surface,
                ),
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(ImageVector.vectorResource(id = R.drawable.ic_arrow_left), contentDescription = "Back")
                    }
                },
            )
        },
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(innerPadding)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(0.dp),
        ) {
            ListItem(
                headlineContent = { Text("Account") },
                leadingContent = { Icon(ImageVector.vectorResource(id = R.drawable.ic_user), contentDescription = null) },
                modifier = Modifier.fillMaxWidth().clickable { subScreen = SettingsSubScreen.LOGIN },
            )
            ListItem(
                headlineContent = { Text("Sync") },
                leadingContent = { Icon(ImageVector.vectorResource(id = R.drawable.ic_cloud), contentDescription = null) },
                modifier = Modifier.fillMaxWidth().clickable { subScreen = SettingsSubScreen.SYNC },
            )
            ListItem(
                headlineContent = { Text("Backup & Restore") },
                leadingContent = { Icon(ImageVector.vectorResource(id = R.drawable.ic_cloud_upload), contentDescription = null) },
                modifier = Modifier.fillMaxWidth().clickable { subScreen = SettingsSubScreen.BACKUP },
            )

            HorizontalDivider()

            ListItem(
                headlineContent = { Text("Location") },
                leadingContent = { Icon(ImageVector.vectorResource(id = R.drawable.ic_map_pin), contentDescription = null) },
                modifier = Modifier.fillMaxWidth().clickable { subScreen = SettingsSubScreen.LOCATION },
            )
            ListItem(
                headlineContent = { Text("Prayer Time") },
                leadingContent = { Icon(ImageVector.vectorResource(id = R.drawable.ic_clock), contentDescription = null) },
                modifier = Modifier.fillMaxWidth().clickable { subScreen = SettingsSubScreen.PRAYER_TIME },
            )
            ListItem(
                headlineContent = { Text("Hijri Date") },
                leadingContent = { Icon(ImageVector.vectorResource(id = R.drawable.ic_moon), contentDescription = null) },
                modifier = Modifier.fillMaxWidth().clickable { subScreen = SettingsSubScreen.HIJRI_MONTH_OFFSETS },
            )
            ListItem(
                headlineContent = { Text("Reminders") },
                leadingContent = { Icon(ImageVector.vectorResource(id = R.drawable.ic_bell), contentDescription = null) },
                modifier = Modifier.fillMaxWidth().clickable { subScreen = SettingsSubScreen.REMINDERS },
            )

            HorizontalDivider()

            ListItem(
                headlineContent = { Text("About") },
                leadingContent = { Icon(ImageVector.vectorResource(id = R.drawable.ic_info_circle), contentDescription = null) },
                modifier = Modifier.fillMaxWidth().clickable { subScreen = SettingsSubScreen.ABOUT },
            )
        }
    }
}
