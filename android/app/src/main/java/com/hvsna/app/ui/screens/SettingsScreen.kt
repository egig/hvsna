package com.hvsna.app.ui.screens

import android.Manifest
import android.app.AlarmManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuAnchorType
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LargeTopAppBar
import androidx.compose.material3.ListItem
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import com.hvsna.app.backup.BackupFileService
import com.hvsna.app.data.CityResult
import com.hvsna.app.data.LocationRepository
import com.hvsna.app.data.SettingsRepository
import com.hvsna.app.ui.AuthViewModel
import compose.icons.TablerIcons
import compose.icons.tablericons.ArrowLeft
import compose.icons.tablericons.ChevronRight
import compose.icons.tablericons.CloudUpload
import compose.icons.tablericons.Minus
import compose.icons.tablericons.Plus
import compose.icons.tablericons.Search
import compose.icons.tablericons.User
import kotlinx.coroutines.launch

private fun hasNotificationPermission(context: Context): Boolean =
    NotificationManagerCompat.from(context).areNotificationsEnabled()

private fun hasExactAlarmPermission(context: Context): Boolean {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return true
    val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
    return alarmManager.canScheduleExactAlarms()
}

private val calculationMethods = listOf(
    "Muslim World League" to "MUSLIM_WORLD_LEAGUE",
    "Egyptian General Authority" to "EGYPTIAN",
    "University of Islamic Sciences, Karachi" to "KARACHI",
    "Umm al-Qura, Makkah" to "UMM_AL_QURA",
    "Dubai" to "DUBAI",
    "Moon Sighting Committee" to "MOON_SIGHTING_COMMITTEE",
    "North America (ISNA)" to "NORTH_AMERICA",
    "Kuwait" to "KUWAIT",
    "Qatar" to "QATAR",
    "Singapore" to "SINGAPORE",
    "Turkey" to "TURKEY",
    "Tehran" to "TEHRAN",
    "Other" to "OTHER",
)

private val madhabOptions = listOf(
    "Shafi, Maliki, Hanbali" to "SHAFI",
    "Hanafi" to "HANAFI",
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    settingsRepository: SettingsRepository,
    locationRepository: LocationRepository,
    backupFileService: BackupFileService,
    authViewModel: AuthViewModel,
    onBack: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val settings by settingsRepository.settings.collectAsState(initial = com.hvsna.app.data.AppSettings())

    var searchQuery by remember { mutableStateOf("") }
    var searchResults by remember { mutableStateOf<List<CityResult>>(emptyList()) }
    var isSearching by remember { mutableStateOf(false) }
    var isDetecting by remember { mutableStateOf(false) }

    var methodExpanded by remember { mutableStateOf(false) }
    var madhabExpanded by remember { mutableStateOf(false) }

    var remindersPendingEnable by remember { mutableStateOf(false) }
    var remindersMessage by remember { mutableStateOf<String?>(null) }

    var showLogin by remember { mutableStateOf(false) }
    var showBackup by remember { mutableStateOf(false) }

    if (showLogin) {
        SettingsLoginScreen(viewModel = authViewModel, onBack = { showLogin = false }, modifier = modifier)
        return
    }
    if (showBackup) {
        SettingsBackupScreen(backupFileService = backupFileService, onBack = { showBackup = false }, modifier = modifier)
        return
    }

    val notificationPermissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted ->
        if (granted) {
            if (hasExactAlarmPermission(context)) {
                scope.launch { settingsRepository.updateRemindersEnabled(true) }
                remindersPendingEnable = false
            } else {
                context.startActivity(
                    Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM, Uri.parse("package:${context.packageName}"))
                )
            }
        } else {
            remindersPendingEnable = false
            remindersMessage = "Notification permission is required for reminders"
        }
    }

    fun requestEnableReminders() {
        remindersMessage = null
        remindersPendingEnable = true
        val needsNotificationPermission = Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            !hasNotificationPermission(context)
        if (needsNotificationPermission) {
            notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
        } else if (!hasExactAlarmPermission(context)) {
            context.startActivity(
                Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM, Uri.parse("package:${context.packageName}"))
            )
        } else {
            scope.launch { settingsRepository.updateRemindersEnabled(true) }
            remindersPendingEnable = false
        }
    }

    val lifecycleOwner = LocalLifecycleOwner.current
    DisposableEffect(lifecycleOwner, settings.remindersEnabled) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_RESUME) {
                val notifOk = hasNotificationPermission(context)
                val alarmOk = hasExactAlarmPermission(context)
                if (remindersPendingEnable) {
                    if (notifOk && alarmOk) {
                        scope.launch { settingsRepository.updateRemindersEnabled(true) }
                        remindersPendingEnable = false
                        remindersMessage = null
                    }
                } else if (settings.remindersEnabled && (!notifOk || !alarmOk)) {
                    scope.launch { settingsRepository.updateRemindersEnabled(false) }
                    remindersMessage = "Reminders permission was revoked"
                }
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
    }

    val currentMethodLabel = calculationMethods
        .firstOrNull { it.second == settings.calculationMethod }?.first
        ?: settings.calculationMethod

    val currentMadhabLabel = madhabOptions
        .firstOrNull { it.second == settings.madhab }?.first
        ?: settings.madhab

    val locationPermissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted ->
        if (granted) {
            isDetecting = true
            scope.launch {
                val location = locationRepository.getLastLocation()
                if (location != null) {
                    val cityName = locationRepository.reverseGeocode(location.first, location.second)
                        ?: "${location.first}, ${location.second}"
                    settingsRepository.updateLocation(location.first, location.second, cityName)
                }
                isDetecting = false
            }
        }
    }

    fun detectLocation() {
        val hasPermission = ContextCompat.checkSelfPermission(
            context, Manifest.permission.ACCESS_COARSE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED

        if (hasPermission) {
            isDetecting = true
            scope.launch {
                val location = locationRepository.getLastLocation()
                if (location != null) {
                    val cityName = locationRepository.reverseGeocode(location.first, location.second)
                        ?: "${location.first}, ${location.second}"
                    settingsRepository.updateLocation(location.first, location.second, cityName)
                }
                isDetecting = false
            }
        } else {
            locationPermissionLauncher.launch(Manifest.permission.ACCESS_COARSE_LOCATION)
        }
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
        ListItem(
            headlineContent = { Text("Account") },
            leadingContent = { Icon(TablerIcons.User, contentDescription = null) },
            trailingContent = { Icon(TablerIcons.ChevronRight, contentDescription = null) },
            modifier = Modifier.fillMaxWidth().clickable { showLogin = true },
        )
        ListItem(
            headlineContent = { Text("Backup & Restore") },
            leadingContent = { Icon(TablerIcons.CloudUpload, contentDescription = null) },
            trailingContent = { Icon(TablerIcons.ChevronRight, contentDescription = null) },
            modifier = Modifier.fillMaxWidth().clickable { showBackup = true },
        )

        HorizontalDivider()

        // Location section
        Text("Location", style = MaterialTheme.typography.titleMedium)

        Text(
            if (settings.cityName.isNotEmpty()) settings.cityName else "Location not set",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )

        Button(
            onClick = { detectLocation() },
            enabled = !isDetecting,
            modifier = Modifier.fillMaxWidth(),
        ) {
            if (isDetecting) {
                CircularProgressIndicator(
                    modifier = Modifier.padding(end = 8.dp),
                    strokeWidth = 2.dp,
                    color = MaterialTheme.colorScheme.onPrimary,
                )
            }
            Text(if (isDetecting) "Detecting…" else "Use GPS")
        }

        OutlinedTextField(
            value = searchQuery,
            onValueChange = { searchQuery = it },
            label = { Text("Search city") },
            singleLine = true,
            trailingIcon = {
                IconButton(
                    onClick = {
                        if (searchQuery.isNotBlank()) {
                            isSearching = true
                            scope.launch {
                                searchResults = locationRepository.searchCity(searchQuery)
                                isSearching = false
                            }
                        }
                    },
                ) {
                    if (isSearching) {
                        CircularProgressIndicator(strokeWidth = 2.dp)
                    } else {
                        Icon(TablerIcons.Search, contentDescription = "Search")
                    }
                }
            },
            modifier = Modifier.fillMaxWidth(),
        )

        if (searchResults.isNotEmpty()) {
            Column {
                searchResults.forEach { result ->
                    ListItem(
                        headlineContent = { Text(result.name, maxLines = 2) },
                        modifier = Modifier.clickable {
                            scope.launch {
                                settingsRepository.updateLocation(result.lat, result.lng, result.name)
                                searchResults = emptyList()
                                searchQuery = ""
                            }
                        },
                    )
                    HorizontalDivider()
                }
            }
        }

        HorizontalDivider()

        // Calculation method
        Text("Calculation Method", style = MaterialTheme.typography.titleMedium)

        ExposedDropdownMenuBox(
            expanded = methodExpanded,
            onExpandedChange = { methodExpanded = it },
        ) {
            OutlinedTextField(
                value = currentMethodLabel,
                onValueChange = {},
                readOnly = true,
                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = methodExpanded) },
                modifier = Modifier
                    .fillMaxWidth()
                    .menuAnchor(ExposedDropdownMenuAnchorType.PrimaryNotEditable),
            )
            ExposedDropdownMenu(
                expanded = methodExpanded,
                onDismissRequest = { methodExpanded = false },
            ) {
                calculationMethods.forEach { (label, value) ->
                    DropdownMenuItem(
                        text = { Text(label) },
                        onClick = {
                            scope.launch { settingsRepository.updateCalculationMethod(value) }
                            methodExpanded = false
                        },
                    )
                }
            }
        }

        HorizontalDivider()

        // Madhab
        Text("Madhab (Asr calculation)", style = MaterialTheme.typography.titleMedium)

        ExposedDropdownMenuBox(
            expanded = madhabExpanded,
            onExpandedChange = { madhabExpanded = it },
        ) {
            OutlinedTextField(
                value = currentMadhabLabel,
                onValueChange = {},
                readOnly = true,
                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = madhabExpanded) },
                modifier = Modifier
                    .fillMaxWidth()
                    .menuAnchor(ExposedDropdownMenuAnchorType.PrimaryNotEditable),
            )
            ExposedDropdownMenu(
                expanded = madhabExpanded,
                onDismissRequest = { madhabExpanded = false },
            ) {
                madhabOptions.forEach { (label, value) ->
                    DropdownMenuItem(
                        text = { Text(label) },
                        onClick = {
                            scope.launch { settingsRepository.updateMadhab(value) }
                            madhabExpanded = false
                        },
                    )
                }
            }
        }

        HorizontalDivider()

        // Hijri date adjustment
        Text("Hijri Date Adjustment", style = MaterialTheme.typography.titleMedium)

        Text(
            "Shift the displayed Hijri date if it doesn't match your local moon sighting.",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )

        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            IconButton(
                onClick = {
                    scope.launch { settingsRepository.updateHijriAdjustment(settings.hijriAdjustment - 1) }
                },
                enabled = settings.hijriAdjustment > -2,
            ) {
                Icon(TablerIcons.Minus, contentDescription = "Decrease")
            }
            Text(
                if (settings.hijriAdjustment == 0) "0 days" else "%+d days".format(settings.hijriAdjustment),
                style = MaterialTheme.typography.bodyLarge,
            )
            IconButton(
                onClick = {
                    scope.launch { settingsRepository.updateHijriAdjustment(settings.hijriAdjustment + 1) }
                },
                enabled = settings.hijriAdjustment < 2,
            ) {
                Icon(TablerIcons.Plus, contentDescription = "Increase")
            }
        }

        HorizontalDivider()

        // Reminders section
        Text("Reminders", style = MaterialTheme.typography.titleMedium)

        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.fillMaxWidth(),
        ) {
            Text(
                "Get notified before scheduled tasks are due",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.weight(1f),
            )
            Switch(
                checked = settings.remindersEnabled,
                onCheckedChange = { enabled ->
                    if (enabled) {
                        requestEnableReminders()
                    } else {
                        remindersPendingEnable = false
                        remindersMessage = null
                        scope.launch { settingsRepository.updateRemindersEnabled(false) }
                    }
                },
            )
        }
        remindersMessage?.let {
            Text(it, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.error)
        }

        HorizontalDivider()

        // Legal section
        Text("Legal", style = MaterialTheme.typography.titleMedium)
        Column {
            ListItem(
                headlineContent = { Text("Privacy Policy") },
                modifier = Modifier.clickable {
                    context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("https://www.hvsna.com/privacy")))
                },
            )
            ListItem(
                headlineContent = { Text("Terms of Service") },
                modifier = Modifier.clickable {
                    context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("https://www.hvsna.com/terms")))
                },
            )
        }

        HorizontalDivider()

        // About section
        val versionName = remember {
            try {
                context.packageManager.getPackageInfo(context.packageName, 0).versionName
            } catch (_: Exception) {
                "Unknown"
            }
        }

        Text("About", style = MaterialTheme.typography.titleMedium)
        Column {
            Text(
                "Hvsna",
                style = MaterialTheme.typography.bodyLarge,
                fontWeight = FontWeight.Bold
            )
            Text(
                "Version $versionName",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }

        // bottom spacer
        Text("", modifier = Modifier.padding(bottom = 16.dp))
    }
    }
}
