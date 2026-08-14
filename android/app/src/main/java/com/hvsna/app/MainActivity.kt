package com.hvsna.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.adaptive.navigationsuite.NavigationSuiteDefaults
import androidx.compose.material3.adaptive.navigationsuite.NavigationSuiteScaffold
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.viewmodel.compose.viewModel
import com.google.firebase.crashlytics.FirebaseCrashlytics
import com.hvsna.app.auth.AuthApi
import com.hvsna.app.auth.AuthService
import com.hvsna.app.auth.SessionRepository
import com.hvsna.app.auth.TokenStore
import com.hvsna.app.backup.BackupFileService
import com.hvsna.app.data.LocationRepository
import com.hvsna.app.data.PrayerTimesRepository
import com.hvsna.app.data.RecurrenceManager
import com.hvsna.app.data.SettingsRepository
import com.hvsna.app.data.Tag
import com.hvsna.app.data.TaskDatabase
import com.hvsna.app.data.TaskRepository
import com.hvsna.app.data.TaskWithTags
import com.hvsna.app.reminder.ReminderScheduler
import com.hvsna.app.sync.CursorStore
import com.hvsna.app.sync.SyncApi
import com.hvsna.app.sync.SyncEngine
import com.hvsna.app.sync.SyncManager
import com.hvsna.app.sync.SyncRepository
import com.hvsna.app.sync.SyncWorker
import com.hvsna.app.sync.networkReconnectEvents
import com.hvsna.app.ui.AuthViewModel
import com.hvsna.app.ui.TaskViewModel
import com.hvsna.app.ui.components.TaskBottomSheet
import com.hvsna.app.ui.screens.BrowseScreen
import com.hvsna.app.ui.screens.SearchScreen
import com.hvsna.app.ui.screens.SettingsScreen
import com.hvsna.app.ui.screens.TagDetailScreen
import com.hvsna.app.ui.screens.TodayScreen
import com.hvsna.app.ui.screens.UpcomingScreen
import com.hvsna.app.ui.theme.HvsnaTheme
import compose.icons.TablerIcons
import compose.icons.tablericons.Calendar
import compose.icons.tablericons.CalendarEvent
import compose.icons.tablericons.DotsCircleHorizontal
import compose.icons.tablericons.DotsVertical
import compose.icons.tablericons.Search
import okhttp3.OkHttpClient

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        FirebaseCrashlytics.getInstance().setCrashlyticsCollectionEnabled(!BuildConfig.DEBUG)
        enableEdgeToEdge()
        setContent {
            HvsnaTheme {
                HvsnaApp()
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HvsnaApp() {
    var currentDestination by rememberSaveable { mutableStateOf(AppDestinations.TODAY) }
    var showSettings by rememberSaveable { mutableStateOf(false) }
    var selectedTagId by rememberSaveable { mutableStateOf<String?>(null) }
    var showTaskSheet by remember { mutableStateOf(false) }
    var editingTask by remember { mutableStateOf<TaskWithTags?>(null) }
    var taskDefaultScheduledTime by remember { mutableStateOf<Long?>(null) }
    val taskSheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)

    val context = LocalContext.current
    val okHttpClient = remember { OkHttpClient() }
    val db = TaskDatabase.getInstance(context)
    val taskRepo = TaskRepository(db.taskDao(), context)
    val backupFileService = remember(taskRepo) { BackupFileService(taskRepo, context) }
    val settingsRepo = remember { SettingsRepository(context, db.settingsDao()) }
    val locationRepo = remember { LocationRepository(context, okHttpClient) }
    val prayerTimesRepo = remember { PrayerTimesRepository() }
    val reminderScheduler = remember { ReminderScheduler(context) }
    val recurrenceManager = remember { RecurrenceManager(taskRepo, prayerTimesRepo, reminderScheduler) }
    val taskViewModel: TaskViewModel = viewModel(
        factory = TaskViewModel.Factory(taskRepo, settingsRepo, prayerTimesRepo, recurrenceManager, reminderScheduler)
    )
    val tokenStore = remember { TokenStore() }
    val authService = remember {
        AuthService(AuthApi(okHttpClient), tokenStore, SessionRepository(context))
    }
    val authViewModel: AuthViewModel = viewModel(factory = AuthViewModel.Factory(authService))
    val authState by authViewModel.state.collectAsState()

    val syncCoroutineScope = rememberCoroutineScope()
    val syncEngine = remember {
        SyncEngine(
            SyncRepository(db.taskDao(), db.settingsDao()),
            SyncApi(okHttpClient, authService, tokenStore),
            CursorStore(db.syncStateDao()),
        )
    }
    val syncManager = remember {
        SyncManager(syncEngine, isAuthenticated = { authService.isAuthenticated() }, scope = syncCoroutineScope)
    }

    // Sign-in / app-foreground trigger, plus WorkManager (de)scheduling on auth transitions.
    LaunchedEffect(authState.user != null) {
        if (authState.user != null) {
            syncManager.requestSync()
            SyncWorker.schedule(context)
        } else if (!authState.loading) {
            SyncWorker.cancel(context)
        }
    }
    // Reconnect trigger.
    LaunchedEffect(Unit) {
        networkReconnectEvents(context).collect {
            if (authService.isAuthenticated()) syncManager.requestSync()
        }
    }

    val allTags by taskViewModel.allTags.collectAsState()
    val allRecurrenceRules by taskViewModel.allRecurrenceRules.collectAsState()
    val settings by taskViewModel.settings.collectAsState()
    val activeTag = allTags.firstOrNull { it.id == selectedTagId }

    val onEditTask: (TaskWithTags?, Long?) -> Unit = { task, defaultScheduledTime ->
        editingTask = task
        taskDefaultScheduledTime = defaultScheduledTime
        showTaskSheet = true
    }

    if (showSettings) {
        SettingsScreen(
            settingsRepository = settingsRepo,
            locationRepository = locationRepo,
            backupFileService = backupFileService,
            authViewModel = authViewModel,
            syncManager = syncManager,
            onBack = { showSettings = false },
        )
    } else if (activeTag != null) {
        TagDetailScreen(
            viewModel = taskViewModel,
            tag = activeTag,
            onBack = { selectedTagId = null },
            onEditTask = onEditTask,
        )
    } else {
        NavigationSuiteScaffold(
            navigationSuiteColors = NavigationSuiteDefaults.colors(
                navigationBarContainerColor = MaterialTheme.colorScheme.surface,
                navigationRailContainerColor = MaterialTheme.colorScheme.surface,
            ),
            navigationSuiteItems = {
                AppDestinations.entries.forEach {
                    item(
                        icon = {
                            Icon(
                                imageVector = it.icon,
                                contentDescription = it.label
                            )
                        },
                        label = { Text(it.label) },
                        selected = it == currentDestination,
                        onClick = { currentDestination = it }
                    )
                }
            }
        ) {
            val onTagClick: (Tag) -> Unit = { tag -> selectedTagId = tag.id }
            when (currentDestination) {
                AppDestinations.TODAY -> TodayScreen(taskViewModel, onTagClick = onTagClick, onEditTask = onEditTask)
                AppDestinations.UPCOMING -> UpcomingScreen(taskViewModel, onTagClick = onTagClick, onEditTask = onEditTask)
                AppDestinations.SEARCH -> SearchScreen(taskViewModel, onTagClick = onTagClick, onEditTask = onEditTask)
                AppDestinations.BROWSE -> BrowseScreen(taskViewModel, onOpenSettings = { showSettings = true }, onTagClick = onTagClick, onEditTask = onEditTask)
            }
        }
    }

    if (showTaskSheet) {
        TaskBottomSheet(
            task = editingTask?.task,
            sheetState = taskSheetState,
            onDismiss = { showTaskSheet = false },
            onSave = { task, tagIds, recurrence -> taskViewModel.upsert(editingTask?.task, task, tagIds, recurrence) },
            onDelete = { taskViewModel.delete(it) },
            hasLocation = settings.hasLocation,
            remindersGloballyEnabled = settings.remindersEnabled,
            getPrayerTimes = taskViewModel::getPrayerTimesForDate,
            onOpenSettings = { showSettings = true },
            hijriMonthOffsets = settings.hijriMonthOffsets,
            allTags = allTags,
            initialTagIds = editingTask?.tags?.map { it.id }?.toSet() ?: emptySet(),
            onCreateTag = { taskViewModel.createTag(it) },
            defaultScheduledTime = taskDefaultScheduledTime,
            recurrenceRule = editingTask?.task?.recurringTaskId?.let { id -> allRecurrenceRules.firstOrNull { it.id == id } },
        )
    }
}

enum class AppDestinations(
    val label: String,
    val icon: ImageVector,
) {
    TODAY("Today", TablerIcons.Calendar),
    UPCOMING("Upcoming", TablerIcons.CalendarEvent),
    SEARCH("Search", TablerIcons.Search),
    BROWSE("More", TablerIcons.DotsCircleHorizontal),
}
