package com.hvsna.app.ui.screens

import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.LargeTopAppBar
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.input.nestedscroll.nestedScroll
import com.hvsna.app.data.Tag
import com.hvsna.app.data.TaskWithTags
import com.hvsna.app.ui.TaskViewModel
import com.hvsna.app.ui.components.EmptyState
import com.hvsna.app.ui.components.GroupHeader
import com.hvsna.app.ui.components.TaskListItem
import compose.icons.TablerIcons
import compose.icons.tablericons.CalendarEvent
import compose.icons.tablericons.Plus
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

private val dateHeaderFormat = SimpleDateFormat("EEE, MMM d", Locale.getDefault())

private const val TAB_SCHEDULED = 0
private const val TAB_UNSCHEDULED = 1

@OptIn(ExperimentalMaterial3Api::class, ExperimentalFoundationApi::class)
@Composable
fun UpcomingScreen(
    viewModel: TaskViewModel,
    onTagClick: (Tag) -> Unit = {},
    onEditTask: (TaskWithTags?, Long?) -> Unit,
    modifier: Modifier = Modifier,
) {
    val upcomingTasks by viewModel.upcomingTasks.collectAsState()
    val unscheduledTasks by viewModel.unscheduledTasks.collectAsState()

    val tasksByDate: Map<String, List<TaskWithTags>> = upcomingTasks
        .groupBy { dateHeaderFormat.format(Date(it.task.scheduledTime ?: 0L)) }

    val scrollBehavior = TopAppBarDefaults.exitUntilCollapsedScrollBehavior()
    val expandedGroups = remember { mutableStateMapOf<String, Boolean>() }
    var selectedTab by remember { mutableIntStateOf(TAB_SCHEDULED) }
    val defaultScheduledTime = remember {
        Calendar.getInstance().apply {
            add(Calendar.DAY_OF_MONTH, 1)
            set(Calendar.HOUR_OF_DAY, 23)
            set(Calendar.MINUTE, 59)
            set(Calendar.SECOND, 59)
            set(Calendar.MILLISECOND, 999)
        }.timeInMillis
    }
    val scheduledListState = rememberLazyListState()
    val unscheduledListState = rememberLazyListState()
    val isScheduledEmpty = tasksByDate.isEmpty()
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
            Column {
                LargeTopAppBar(
                    title = { Text("Upcoming") },
                    scrollBehavior = scrollBehavior,
                )
                TabRow(selectedTabIndex = selectedTab) {
                    Tab(
                        selected = selectedTab == TAB_SCHEDULED,
                        onClick = { selectedTab = TAB_SCHEDULED },
                        text = { Text("Scheduled") },
                    )
                    Tab(
                        selected = selectedTab == TAB_UNSCHEDULED,
                        onClick = { selectedTab = TAB_UNSCHEDULED },
                        text = { Text("Unscheduled") },
                    )
                }
            }
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = { onEditTask(null, defaultScheduledTime) },
            ) {
                Icon(TablerIcons.Plus, contentDescription = "Add task")
            }
        },
    ) { innerPadding ->
        when (selectedTab) {
            TAB_SCHEDULED -> if (isScheduledEmpty) {
                EmptyState(
                    icon = TablerIcons.CalendarEvent,
                    title = "No upcoming tasks",
                    subtitle = "Tasks you schedule for the future will show up here.",
                    modifier = Modifier.padding(innerPadding),
                )
            } else {
                LazyColumn(
                    state = scheduledListState,
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = innerPadding,
                ) {
                    tasksByDate.forEach { (dateLabel, tasks) ->
                        val isExpanded = expandedGroups.getOrPut(dateLabel) { true }

                        stickyHeader(key = "header_$dateLabel") {
                            GroupHeader(
                                title = dateLabel,
                                isExpanded = isExpanded,
                                onToggle = { expandedGroups[dateLabel] = !isExpanded },
                            )
                        }

                        if (isExpanded) {
                            items(tasks, key = { it.task.id }) { entry ->
                                TaskListItem(
                                    task = entry.task,
                                    tags = entry.tags,
                                    onToggleDone = { viewModel.toggleDone(entry.task) },
                                    onClick = { onEditTask(entry, null) },
                                )
                            }
                        }
                    }
                }
            }

            TAB_UNSCHEDULED -> if (isUnscheduledEmpty) {
                EmptyState(
                    icon = TablerIcons.CalendarEvent,
                    title = "No unscheduled tasks",
                    subtitle = "Tasks without a date will show up here.",
                    modifier = Modifier.padding(innerPadding),
                )
            } else {
                LazyColumn(
                    state = unscheduledListState,
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = innerPadding,
                ) {
                    items(unscheduledTasks, key = { it.task.id }) { entry ->
                        TaskListItem(
                            task = entry.task,
                            tags = entry.tags,
                            onToggleDone = { viewModel.toggleDone(entry.task) },
                            onClick = { onEditTask(entry, null) },
                        )
                    }
                }
            }
        }
    }
}
