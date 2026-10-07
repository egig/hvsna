package com.hvsna.app.ui.screens

import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.gestures.Orientation
import androidx.compose.foundation.gestures.draggable
import androidx.compose.foundation.gestures.rememberDraggableState
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.PagerState
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.LargeTopAppBar
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Modifier
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch
import kotlin.math.ceil
import kotlin.math.floor
import kotlin.math.roundToInt
import com.hvsna.app.data.Tag
import com.hvsna.app.data.TaskWithTags
import com.hvsna.app.ui.TaskViewModel
import com.hvsna.app.ui.components.EmptyState
import com.hvsna.app.ui.components.SectionHeader
import com.hvsna.app.ui.components.TaskListItem
import java.util.Calendar
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.vectorResource
import com.hvsna.app.R
import com.hvsna.app.i18n.LocalStrings
import com.hvsna.app.ui.groupUpcomingTasks

private const val TAB_SCHEDULED = 0
private const val TAB_UNSCHEDULED = 1
private const val TAB_COUNT = 2

@OptIn(ExperimentalMaterial3Api::class, ExperimentalFoundationApi::class)
@Composable
fun UpcomingScreen(
    viewModel: TaskViewModel,
    onTagClick: (Tag) -> Unit = {},
    onEditTask: (TaskWithTags?, Long?) -> Unit,
    onReschedule: (TaskWithTags) -> Unit = {},
    modifier: Modifier = Modifier,
) {
    val strings = LocalStrings.current
    val upcomingTasks by viewModel.upcomingTasks.collectAsState()
    val unscheduledTasks by viewModel.unscheduledTasks.collectAsState()
    val settings by viewModel.settings.collectAsState()

    val taskGroups = groupUpcomingTasks(upcomingTasks, strings).filter { it.tasks.isNotEmpty() }

    val scrollBehavior = TopAppBarDefaults.exitUntilCollapsedScrollBehavior()
    val expandedGroups = remember { mutableStateMapOf<String, Boolean>() }
    // Tabs are pages of a HorizontalPager so the body can be swiped between them. Task rows keep
    // their own swipe actions: SwipeToDismissBox is a descendant, so it sees the drag first and
    // claims it past touch slop, leaving the pager to take swipes that start anywhere else (section
    // headers, empty states, the blank area below a short list).
    val pagerState = rememberPagerState(initialPage = TAB_SCHEDULED) { TAB_COUNT }
    val selectedTab = pagerState.currentPage
    val coroutineScope = rememberCoroutineScope()
    val scheduledListState = rememberLazyListState()
    val unscheduledListState = rememberLazyListState()
    val isScheduledEmpty = taskGroups.isEmpty()
    val isUnscheduledEmpty = unscheduledTasks.isEmpty()
    val canScroll = when (selectedTab) {
        TAB_SCHEDULED -> !isScheduledEmpty && (scheduledListState.canScrollForward || scheduledListState.canScrollBackward)
        else -> !isUnscheduledEmpty && (unscheduledListState.canScrollForward || unscheduledListState.canScrollBackward)
    }

    Scaffold(
        modifier = modifier
            .fillMaxSize()
            .let { if (canScroll) it.nestedScroll(scrollBehavior.nestedScrollConnection) else it },
        topBar = {
            // The title + tab row never hosts task rows, so it is always free to switch tabs by
            // swiping — the fallback for a tab whose list is nothing but swipeable rows.
            Column(modifier = Modifier.pagerSwipeHandle(pagerState)) {
                LargeTopAppBar(
                    title = { Text(strings["upcoming.title"]) },
                    scrollBehavior = scrollBehavior,
                    colors = TopAppBarDefaults.largeTopAppBarColors(
                        containerColor = MaterialTheme.colorScheme.surface,
                        scrolledContainerColor = MaterialTheme.colorScheme.surface,
                    ),
                )
                TabRow(selectedTabIndex = selectedTab) {
                    Tab(
                        selected = selectedTab == TAB_SCHEDULED,
                        onClick = { coroutineScope.launch { pagerState.animateScrollToPage(TAB_SCHEDULED) } },
                        text = { Text(strings["upcoming.tabScheduled"]) },
                    )
                    Tab(
                        selected = selectedTab == TAB_UNSCHEDULED,
                        onClick = { coroutineScope.launch { pagerState.animateScrollToPage(TAB_UNSCHEDULED) } },
                        text = { Text(strings["upcoming.tabUnscheduled"]) },
                    )
                }
            }
        },
    ) { innerPadding ->
        HorizontalPager(
            state = pagerState,
            modifier = Modifier.fillMaxSize(),
        ) { page ->
            when (page) {
                TAB_SCHEDULED -> if (isScheduledEmpty) {
                    EmptyState(
                        icon = ImageVector.vectorResource(id = R.drawable.ic_calendar_event),
                        title = strings["upcoming.emptyScheduledTitle"],
                        subtitle = strings["upcoming.emptyScheduledSubtitle"],
                        modifier = Modifier.padding(innerPadding),
                    )
                } else {
                    LazyColumn(
                        state = scheduledListState,
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = innerPadding,
                    ) {
                        taskGroups.forEach { group ->
                            val isExpanded = expandedGroups.getOrPut(group.key) { true }

                            stickyHeader(key = "header_${group.key}") {
                                SectionHeader(
                                    label = group.label,
                                    isExpanded = isExpanded,
                                    onToggle = { expandedGroups[group.key] = !isExpanded },
                                    background = MaterialTheme.colorScheme.surface,
                                )
                            }

                            if (isExpanded) {
                                val isYearGroup = group.key.startsWith("year_")
                                itemsIndexed(group.tasks, key = { _, entry -> entry.task.id }) { index, entry ->
                                    TaskListItem(
                                        task = entry.task,
                                        tags = entry.tags,
                                        showDate = isYearGroup,
                                        showYear = isYearGroup,
                                        onToggleDone = { viewModel.toggleDone(entry) },
                                        onClick = { onEditTask(entry, null) },
                                        onReschedule = { onReschedule(entry) },
                                        showDivider = index != group.tasks.lastIndex,
                                        hijriMonthOffsets = settings.hijriMonthOffsets,
                                        modifier = Modifier.animateItem(),
                                    )
                                }
                            }
                        }
                    }
                }

                TAB_UNSCHEDULED -> if (isUnscheduledEmpty) {
                    EmptyState(
                        icon = ImageVector.vectorResource(id = R.drawable.ic_calendar_event),
                        title = strings["upcoming.emptyUnscheduledTitle"],
                        subtitle = strings["upcoming.emptyUnscheduledSubtitle"],
                        modifier = Modifier.padding(innerPadding),
                    )
                } else {
                    LazyColumn(
                        state = unscheduledListState,
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = innerPadding,
                    ) {
                        itemsIndexed(unscheduledTasks, key = { _, entry -> entry.task.id }) { index, entry ->
                            TaskListItem(
                                task = entry.task,
                                tags = entry.tags,
                                showDate = false,
                                onToggleDone = { viewModel.toggleDone(entry) },
                                onClick = { onEditTask(entry, null) },
                                onReschedule = { onReschedule(entry) },
                                showDivider = index != unscheduledTasks.lastIndex,
                                hijriMonthOffsets = settings.hijriMonthOffsets,
                                modifier = Modifier.animateItem(),
                            )
                        }
                    }
                }
            }
        }
    }
}

/**
 * Lets a horizontal drag on this element scroll [pagerState] as if it were the pager itself, then
 * settles on the page the drag was heading toward (by fling velocity, otherwise nearest page).
 */
@Composable
private fun Modifier.pagerSwipeHandle(pagerState: PagerState): Modifier {
    val minFlingVelocity = with(LocalDensity.current) { 400.dp.toPx() }
    val draggableState = rememberDraggableState { delta -> pagerState.dispatchRawDelta(-delta) }
    return draggable(
        state = draggableState,
        orientation = Orientation.Horizontal,
        onDragStopped = { velocity ->
            val position = pagerState.currentPage + pagerState.currentPageOffsetFraction
            val target = when {
                velocity <= -minFlingVelocity -> ceil(position).toInt()
                velocity >= minFlingVelocity -> floor(position).toInt()
                else -> position.roundToInt()
            }.coerceIn(0, pagerState.pageCount - 1)
            pagerState.animateScrollToPage(target)
        },
    )
}

/** Rendered outside [UpcomingScreen]'s own Scaffold so
 * the FAB stays pinned in place rather than stretching along with pull-to-refresh. */
@Composable
fun UpcomingScreenFab(onEditTask: (TaskWithTags?, Long?) -> Unit) {
    val strings = LocalStrings.current
    val defaultScheduledTime = remember {
        Calendar.getInstance().apply {
            add(Calendar.DAY_OF_MONTH, 1)
            set(Calendar.HOUR_OF_DAY, 23)
            set(Calendar.MINUTE, 59)
            set(Calendar.SECOND, 59)
            set(Calendar.MILLISECOND, 999)
        }.timeInMillis
    }
    FloatingActionButton(
        onClick = { onEditTask(null, defaultScheduledTime) },
        containerColor = MaterialTheme.colorScheme.primary,
        contentColor = MaterialTheme.colorScheme.onPrimary,
    ) {
        Icon(ImageVector.vectorResource(id = R.drawable.ic_plus), contentDescription = strings["a11y.addTask"])
    }
}
