package com.hvsna.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.heightIn
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Text
import androidx.compose.material3.adaptive.navigationsuite.NavigationSuiteScaffold
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
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
    var selectedTagId by rememberSaveable { mutableStateOf<Int?>(null) }
    val settingsSheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
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
    val authService = remember {
        AuthService(AuthApi(okHttpClient), TokenStore(), SessionRepository(context))
    }
    val authViewModel: AuthViewModel = viewModel(factory = AuthViewModel.Factory(authService))
    val allTags by taskViewModel.allTags.collectAsState()
    val allRecurrenceRules by taskViewModel.allRecurrenceRules.collectAsState()
    val settings by taskViewModel.settings.collectAsState()
    val activeTag = allTags.firstOrNull { it.id == selectedTagId }

    val onEditTask: (TaskWithTags?, Long?) -> Unit = { task, defaultScheduledTime ->
        editingTask = task
        taskDefaultScheduledTime = defaultScheduledTime
        showTaskSheet = true
    }

    if (activeTag != null) {
        TagDetailScreen(
            viewModel = taskViewModel,
            tag = activeTag,
            onBack = { selectedTagId = null },
            onEditTask = onEditTask,
        )
    } else {
        NavigationSuiteScaffold(
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
            onSave = { task, tagIds, recurrence -> taskViewModel.upsert(task, tagIds, recurrence) },
            onDelete = { taskViewModel.delete(it) },
            hasLocation = settings.hasLocation,
            remindersGloballyEnabled = settings.remindersEnabled,
            getPrayerTimes = taskViewModel::getPrayerTimesForDate,
            onOpenSettings = { showSettings = true },
            hijriAdjustment = settings.hijriAdjustment,
            allTags = allTags,
            initialTagIds = editingTask?.tags?.map { it.id }?.toSet() ?: emptySet(),
            onCreateTag = { taskViewModel.createTag(it) },
            defaultScheduledTime = taskDefaultScheduledTime,
            recurrenceRule = editingTask?.task?.recurrenceId?.let { id -> allRecurrenceRules.firstOrNull { it.id == id } },
        )
    }

    if (showSettings) {
        val maxSheetHeight = LocalConfiguration.current.screenHeightDp.dp * 0.8f
        ModalBottomSheet(
            onDismissRequest = { showSettings = false },
            sheetState = settingsSheetState,
        ) {
            SettingsScreen(
                settingsRepository = settingsRepo,
                locationRepository = locationRepo,
                backupFileService = backupFileService,
                authViewModel = authViewModel,
                modifier = Modifier.heightIn(max = maxSheetHeight),
            )
        }
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
