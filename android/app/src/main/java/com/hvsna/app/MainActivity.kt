package com.hvsna.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.adaptive.currentWindowAdaptiveInfo
import androidx.compose.material3.adaptive.navigationsuite.NavigationSuiteDefaults
import androidx.compose.material3.adaptive.navigationsuite.NavigationSuiteScaffold
import androidx.compose.material3.adaptive.navigationsuite.NavigationSuiteScaffoldDefaults
import androidx.compose.material3.adaptive.navigationsuite.NavigationSuiteType
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.material3.pulltorefresh.rememberPullToRefreshState
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.TransformOrigin
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavDestination.Companion.hasRoute
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.toRoute
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
import com.hvsna.app.sync.isOnline
import com.hvsna.app.sync.networkReconnectEvents
import com.hvsna.app.ui.AuthViewModel
import com.hvsna.app.ui.TaskViewModel
import com.hvsna.app.ui.components.TaskBottomSheet
import com.hvsna.app.ui.navigation.AppRoute
import com.hvsna.app.ui.screens.BrowseScreen
import com.hvsna.app.ui.screens.SearchScreen
import com.hvsna.app.ui.screens.SettingsScreen
import com.hvsna.app.ui.screens.TagDetailScreen
import com.hvsna.app.ui.screens.TodayScreen
import com.hvsna.app.ui.screens.UpcomingScreen
import com.hvsna.app.ui.theme.HvsnaTheme
import okhttp3.OkHttpClient
import androidx.compose.ui.res.vectorResource

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
    var showTaskSheet by remember { mutableStateOf(false) }
    var editingTask by remember { mutableStateOf<TaskWithTags?>(null) }
    var taskDefaultScheduledTime by remember { mutableStateOf<Long?>(null) }
    val taskSheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)

    val context = LocalContext.current
    val okHttpClient = remember { OkHttpClient() }
    val db = TaskDatabase.getInstance(context)

    val tokenStore = remember { TokenStore() }
    val authService = remember {
        AuthService(AuthApi(okHttpClient), tokenStore, SessionRepository(context))
    }
    val authViewModel: AuthViewModel = viewModel(factory = AuthViewModel.Factory(authService))
    val authState by authViewModel.state.collectAsState()
    val canSync = authState.user?.emailVerified == true

    val syncCoroutineScope = rememberCoroutineScope()
    val syncEngine = remember {
        SyncEngine(
            SyncRepository(db.taskDao(), db.settingsDao()),
            SyncApi(okHttpClient, authService, tokenStore),
            CursorStore(db.syncStateDao()),
        )
    }
    val syncManager = remember {
        SyncManager(
            fullSync = syncEngine::fullSync,
            canSync = { authService.isAuthenticated() && authViewModel.state.value.user?.emailVerified == true },
            scope = syncCoroutineScope,
            isOnline = { isOnline(context) },
        )
    }

    val taskRepo = remember { TaskRepository(db.taskDao(), context, onDataChanged = syncManager::notifyWrite) }
    val backupFileService = remember(taskRepo) { BackupFileService(taskRepo, context) }
    val settingsRepo = remember {
        SettingsRepository(context, db.settingsDao(), onDataChanged = syncManager::notifyWrite)
    }
    val locationRepo = remember { LocationRepository(context, okHttpClient) }
    val prayerTimesRepo = remember { PrayerTimesRepository() }
    val reminderScheduler = remember { ReminderScheduler(context) }
    val recurrenceManager = remember { RecurrenceManager(taskRepo, prayerTimesRepo, reminderScheduler) }
    val taskViewModel: TaskViewModel = viewModel(
        factory = TaskViewModel.Factory(taskRepo, settingsRepo, prayerTimesRepo, recurrenceManager, reminderScheduler)
    )

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

    val onEditTask: (TaskWithTags?, Long?) -> Unit = { task, defaultScheduledTime ->
        editingTask = task
        taskDefaultScheduledTime = defaultScheduledTime
        showTaskSheet = true
    }

    val navController = rememberNavController()
    val currentBackStackEntry by navController.currentBackStackEntryAsState()
    val isTopLevelRoute = currentBackStackEntry?.destination?.let {
        it.hasRoute(AppRoute.Today::class) ||
            it.hasRoute(AppRoute.Upcoming::class) ||
            it.hasRoute(AppRoute.Search::class) ||
            it.hasRoute(AppRoute.Browse::class)
    } ?: true
    val onTagClick: (Tag) -> Unit = { tag -> navController.navigate(AppRoute.TagDetail(tag.id)) }

    NavigationSuiteScaffold(
        layoutType = if (isTopLevelRoute) {
            NavigationSuiteScaffoldDefaults.calculateFromAdaptiveInfo(currentWindowAdaptiveInfo())
        } else {
            NavigationSuiteType.None
        },
        navigationSuiteColors = NavigationSuiteDefaults.colors(
            navigationBarContainerColor = MaterialTheme.colorScheme.surface,
            navigationRailContainerColor = MaterialTheme.colorScheme.surface,
        ),
        navigationSuiteItems = {
            AppDestinations.entries.forEach {
                val isSelected = currentBackStackEntry?.destination?.hasRoute(it.route::class) == true
                item(
                    icon = {
                        Icon(
                            imageVector = ImageVector.vectorResource(
                                id = if (isSelected) it.activeIconRes else it.iconRes
                            ),
                            contentDescription = it.label
                        )
                    },
                    label = { Text(it.label) },
                    selected = isSelected,
                    onClick = {
                        navController.navigate(it.route) {
                            popUpTo(navController.graph.findStartDestination().id) { saveState = true }
                            launchSingleTop = true
                            restoreState = true
                        }
                    }
                )
            }
        }
    ) {
        NavHost(navController = navController, startDestination = AppRoute.Today) {
            composable<AppRoute.Today> {
                SyncPullToRefreshBox(syncManager = syncManager, canSync = canSync) {
                    TodayScreen(taskViewModel, onTagClick = onTagClick, onEditTask = onEditTask)
                }
            }
            composable<AppRoute.Upcoming> {
                SyncPullToRefreshBox(syncManager = syncManager, canSync = canSync) {
                    UpcomingScreen(taskViewModel, onTagClick = onTagClick, onEditTask = onEditTask)
                }
            }
            composable<AppRoute.Search> {
                SyncPullToRefreshBox(syncManager = syncManager, canSync = canSync) {
                    SearchScreen(taskViewModel, onTagClick = onTagClick, onEditTask = onEditTask)
                }
            }
            composable<AppRoute.Browse> {
                SyncPullToRefreshBox(syncManager = syncManager, canSync = canSync) {
                    BrowseScreen(
                        taskViewModel,
                        onOpenSettings = { navController.navigate(AppRoute.Settings) },
                        onTagClick = onTagClick,
                        onEditTask = onEditTask,
                    )
                }
            }
            composable<AppRoute.TagDetail> { backStackEntry ->
                val route: AppRoute.TagDetail = backStackEntry.toRoute()
                val tag = allTags.firstOrNull { it.id == route.tagId }
                if (tag != null) {
                    SyncPullToRefreshBox(syncManager = syncManager, canSync = canSync) {
                        TagDetailScreen(
                            viewModel = taskViewModel,
                            tag = tag,
                            onBack = { navController.popBackStack() },
                            onEditTask = onEditTask,
                        )
                    }
                } else {
                    // Deep-linked or stale tag id (deleted, or allTags hasn't loaded yet) - bounce back
                    // rather than render TagDetailScreen with nothing to show.
                    LaunchedEffect(Unit) { navController.popBackStack() }
                }
            }
            composable<AppRoute.Settings> {
                SettingsScreen(
                    settingsRepository = settingsRepo,
                    locationRepository = locationRepo,
                    backupFileService = backupFileService,
                    authViewModel = authViewModel,
                    syncManager = syncManager,
                    onBack = { navController.popBackStack() },
                )
            }
        }
    }

    if (showTaskSheet) {
        // The sheet floats above the NavHost rather than being a back-stack entry itself (see
        // AppRoutes.kt) - intercept back explicitly so it dismisses before the NavHost sees it.
        BackHandler { showTaskSheet = false }
        TaskBottomSheet(
            task = editingTask?.task,
            sheetState = taskSheetState,
            onDismiss = { showTaskSheet = false },
            onSave = { task, tagIds, recurrence -> taskViewModel.upsert(editingTask?.task, task, tagIds, recurrence) },
            onDelete = { taskViewModel.delete(it) },
            hasLocation = settings.hasLocation,
            remindersGloballyEnabled = settings.remindersEnabled,
            getPrayerTimes = taskViewModel::getPrayerTimesForDate,
            onOpenSettings = { navController.navigate(AppRoute.Settings) },
            hijriMonthOffsets = settings.hijriMonthOffsets,
            allTags = allTags,
            initialTagIds = editingTask?.tags?.map { it.id }?.toSet() ?: emptySet(),
            onCreateTag = { taskViewModel.createTag(it) },
            defaultScheduledTime = taskDefaultScheduledTime,
            recurrenceRule = editingTask?.task?.recurringTaskId?.let { id -> allRecurrenceRules.firstOrNull { it.id == id } },
        )
    }
}

/**
 * Single, shared pull-to-refresh wrapper for every top-level screen — wraps
 * a whole screen (including its own Scaffold/TopAppBar), not just its list
 * content. Wrapping only the content area (inside a screen's own innerPadding)
 * squeezes the indicator into the gap right below a fixed/collapsed app bar,
 * where it has no headroom to animate into and gets clipped by the bar's own
 * (higher z-order) background — wrapping the full screen gives the indicator
 * the whole screen's headroom instead, and centralizes the isRefreshing/
 * onRefresh wiring to one place rather than duplicating it per screen.
 */
private val StretchMaxOffset = 28.dp
private const val StretchScaleAmount = 0.025f

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun SyncPullToRefreshBox(
    syncManager: SyncManager,
    canSync: Boolean,
    content: @Composable () -> Unit,
) {
    val isManualSyncing by syncManager.isManualSyncing.collectAsState()
    val pullState = rememberPullToRefreshState()
    PullToRefreshBox(
        isRefreshing = isManualSyncing,
        onRefresh = { if (canSync) syncManager.requestSync(manual = true) },
        state = pullState,
        modifier = Modifier.fillMaxSize(),
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .graphicsLayer {
                    // Rubber-band "stretch" while pulling — the page eases down and
                    // stretches slightly instead of staying rigid under the indicator,
                    // snapping back once the pull ends (distanceFraction animates to 0).
                    val stretch = pullState.distanceFraction.coerceIn(0f, 1f)
                    translationY = stretch * StretchMaxOffset.toPx()
                    scaleY = 1f + stretch * StretchScaleAmount
                    transformOrigin = TransformOrigin(0.5f, 0f)
                }
        ) {
            content()
        }
    }
}

enum class AppDestinations(
    val label: String,
    val iconRes: Int,
    val activeIconRes: Int,
    val route: AppRoute,
) {
    TODAY("Today", R.drawable.ic_calendar_event, R.drawable.ic_calendar_event_filled, AppRoute.Today),
    UPCOMING("Upcoming", R.drawable.ic_calendar_month, R.drawable.ic_calendar_month_filled, AppRoute.Upcoming),
    SEARCH("Search", R.drawable.ic_search, R.drawable.ic_search_filled, AppRoute.Search),
    BROWSE("More", R.drawable.ic_dots_circle_horizontal, R.drawable.ic_dots_circle_horizontal, AppRoute.Browse),
}
