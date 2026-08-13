package com.hvsna.app.ui.screens

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.LargeTopAppBar
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.hvsna.app.data.Tag
import com.hvsna.app.data.TaskWithTags
import com.hvsna.app.data.hijriDateLabel
import com.hvsna.app.ui.TaskViewModel
import com.hvsna.app.ui.components.EmptyState
import com.hvsna.app.ui.components.TaskListItem
import compose.icons.TablerIcons
import compose.icons.tablericons.ChevronDown
import compose.icons.tablericons.ListCheck
import compose.icons.tablericons.Plus
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

private val todayHeaderFormat = SimpleDateFormat("EEE, MMM d", Locale.getDefault())
private val timeFormat = SimpleDateFormat("HH:mm", Locale.getDefault())

private sealed class TodayListItem {
    data class PrayerHeader(val name: String) : TodayListItem()
    data class TaskEntry(val entry: TaskWithTags) : TodayListItem()
}

private fun Modifier.dashedLine(color: Color, strokeWidth: Dp = 1.dp): Modifier = drawBehind {
    val y = size.height / 2f
    drawLine(
        color = color,
        start = Offset(0f, y),
        end = Offset(size.width, y),
        strokeWidth = strokeWidth.toPx(),
        pathEffect = PathEffect.dashPathEffect(floatArrayOf(6f, 6f), 0f),
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TodayScreen(
    viewModel: TaskViewModel,
    onTagClick: (Tag) -> Unit = {},
    onEditTask: (TaskWithTags?, Long?) -> Unit,
    modifier: Modifier = Modifier,
) {
    val overdueTasks by viewModel.overdueTasks.collectAsState()
    val todayTasks by viewModel.todayTasks.collectAsState()
    val completedTasks by viewModel.completedTasks.collectAsState()
    val settings by viewModel.settings.collectAsState()

    val prayerTimeMap = remember(settings) {
        if (!settings.hasLocation) emptyMap()
        else Calendar.getInstance().let {
            viewModel.getPrayerTimesForDate(
                it.get(Calendar.YEAR),
                it.get(Calendar.MONTH) + 1,
                it.get(Calendar.DAY_OF_MONTH),
            ).toMap()
        }
    }

    val now = System.currentTimeMillis()
    val (timeOverdue, activeTodayTasks) = todayTasks.partition {
        !it.task.isAllDay && (it.task.scheduledTime ?: Long.MAX_VALUE) < now
    }
    val allOverdueTasks = overdueTasks + timeOverdue.sortedBy { it.task.scheduledTime }

    // task.scheduledTime for a prayer-pinned task holds the *deadline* (next prayer's start,
    // or midnight for Isha) so it can be flagged overdue - not the prayer's own start time.
    // Sorting the visible list by that deadline pushes late-window prayers (Isha) toward
    // midnight, ahead of unrelated tasks that fall earlier in the evening. Use the prayer's
    // actual start time from prayerTimeMap for display ordering instead.
    fun displaySortKey(entry: TaskWithTags): Long {
        val prayer = entry.task.prayerName
        return if (prayer != null) prayerTimeMap[prayer] ?: entry.task.scheduledTime ?: Long.MAX_VALUE
        else entry.task.scheduledTime ?: Long.MAX_VALUE
    }

    val flatTodayItems = buildList {
        val seenPrayers = mutableSetOf<String>()
        for (entry in activeTodayTasks.sortedBy(::displaySortKey)) {
            val prayer = entry.task.prayerName
            if (prayer != null && prayer !in seenPrayers) {
                add(TodayListItem.PrayerHeader(prayer))
                seenPrayers.add(prayer)
            }
            add(TodayListItem.TaskEntry(entry))
        }
    }

    val isEmpty = allOverdueTasks.isEmpty() && flatTodayItems.isEmpty() && completedTasks.isEmpty()

    val scrollBehavior = TopAppBarDefaults.exitUntilCollapsedScrollBehavior()
    val listState = rememberLazyListState()
    val canScroll = !isEmpty && (listState.canScrollForward || listState.canScrollBackward)

    val expandedGroups = remember {
        mutableStateMapOf("Overdue" to true, "Completed" to false)
    }
    val defaultScheduledTime = remember {
        Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, 23)
            set(Calendar.MINUTE, 59)
            set(Calendar.SECOND, 59)
            set(Calendar.MILLISECOND, 999)
        }.timeInMillis
    }

    Scaffold(
        modifier = modifier
            .fillMaxSize()
            .let { if (canScroll) it.nestedScroll(scrollBehavior.nestedScrollConnection) else it },
        topBar = {
            LargeTopAppBar(
                title = {
                    Column {
                        Text(
                            hijriDateLabel(
                                epochMillis = now,
                                adjustmentDays = settings.hijriAdjustment,
                                maghribEpochMillis = prayerTimeMap["Maghrib"],
                            ).uppercase(),
                            fontFamily = FontFamily.Monospace,
                            fontWeight = FontWeight.SemiBold,
                            fontSize = 12.sp,
                            letterSpacing = 1.sp,
                            color = MaterialTheme.colorScheme.primary,
                        )
                        Text(
                            todayHeaderFormat.format(Date()),
                            fontFamily = FontFamily.Serif,
                            fontWeight = FontWeight.SemiBold,
                            fontSize = 30.sp,
                            color = MaterialTheme.colorScheme.onSurface,
                            modifier = Modifier.padding(top = 6.dp, bottom = 6.dp),
                        )
                    }
                },
                scrollBehavior = scrollBehavior,
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = { onEditTask(null, defaultScheduledTime) },
                shape = RoundedCornerShape(16.dp),
            ) {
                Icon(TablerIcons.Plus, contentDescription = "Add task")
            }
        },
    ) { innerPadding ->
        if (isEmpty) {
            EmptyState(
                icon = TablerIcons.ListCheck,
                title = "Nothing scheduled today",
                subtitle = "Tap + to add a task.",
                modifier = Modifier.padding(innerPadding),
            )
            return@Scaffold
        }
        LazyColumn(
            state = listState,
            modifier = Modifier.fillMaxSize(),
            contentPadding = innerPadding,
        ) {

            if (allOverdueTasks.isNotEmpty()) {
                val isExpanded = expandedGroups["Overdue"] == true
                stickyHeader(key = "header_Overdue") {
                    OverdueHeader(
                        isExpanded = isExpanded,
                        onToggle = { expandedGroups["Overdue"] = !isExpanded },
                    )
                }
                if (isExpanded) {
                    items(allOverdueTasks, key = { it.task.id }) { entry ->
                        TaskListItem(
                            task = entry.task,
                            tags = entry.tags,
                            isOverdue = true,
                            inPrayerSection = false,
                            onToggleDone = { viewModel.toggleDone(entry.task) },
                            onClick = { onEditTask(entry, null) },
                        )
                    }
                }
            }

            items(
                flatTodayItems,
                key = { item ->
                    when (item) {
                        is TodayListItem.PrayerHeader -> "prayer_${item.name}"
                        is TodayListItem.TaskEntry -> item.entry.task.id
                    }
                },
            ) { item ->
                when (item) {
                    is TodayListItem.PrayerHeader -> {
                        val timeLabel = prayerTimeMap[item.name]?.let { timeFormat.format(Date(it)) }
                        PrayerSectionHeader(name = item.name, time = timeLabel)
                    }
                    is TodayListItem.TaskEntry -> TaskListItem(
                        task = item.entry.task,
                        tags = item.entry.tags,
                        isOverdue = false,
                        inPrayerSection = true,
                        onToggleDone = { viewModel.toggleDone(item.entry.task) },
                        onClick = { onEditTask(item.entry, null) },
                    )
                }
            }

            if (completedTasks.isNotEmpty()) {
                val isExpanded = expandedGroups["Completed"] == true
                stickyHeader(key = "header_Completed") {
                    CompletedHeader(
                        count = completedTasks.size,
                        isExpanded = isExpanded,
                        onToggle = { expandedGroups["Completed"] = !isExpanded },
                    )
                }
                if (isExpanded) {
                    items(completedTasks, key = { it.task.id }) { entry ->
                        TaskListItem(
                            task = entry.task,
                            tags = entry.tags,
                            isOverdue = false,
                            inPrayerSection = false,
                            onToggleDone = { viewModel.toggleDone(entry.task) },
                            onClick = { onEditTask(entry, null) },
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun OverdueHeader(
    isExpanded: Boolean,
    onToggle: () -> Unit,
) {
    val chevronRotation by animateFloatAsState(targetValue = if (isExpanded) 0f else -90f, label = "chevron")
    Row(
        verticalAlignment = Alignment.Bottom,
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onToggle() }
            .padding(start = 20.dp, end = 20.dp, top = 24.dp, bottom = 8.dp),
    ) {
        Text(
            "Overdue",
            fontFamily = FontFamily.Serif,
            fontWeight = FontWeight.SemiBold,
            fontSize = 17.sp,
            color = MaterialTheme.colorScheme.error,
        )
        Spacer(
            Modifier
                .weight(1f)
                .padding(horizontal = 8.dp)
                .height(1.dp)
                .dashedLine(MaterialTheme.colorScheme.outlineVariant),
        )
        Icon(
            imageVector = TablerIcons.ChevronDown,
            contentDescription = if (isExpanded) "Collapse" else "Expand",
            tint = MaterialTheme.colorScheme.error,
            modifier = Modifier
                .rotate(chevronRotation)
                .size(16.dp),
        )
    }
}

@Composable
private fun PrayerSectionHeader(name: String, time: String?) {
    Row(
        verticalAlignment = Alignment.Bottom,
        modifier = Modifier
            .fillMaxWidth()
            .padding(start = 20.dp, end = 20.dp, top = 40.dp, bottom = 8.dp),
    ) {
        Text(
            name,
            fontFamily = FontFamily.Serif,
            fontWeight = FontWeight.SemiBold,
            fontSize = 17.sp,
            color = MaterialTheme.colorScheme.onSurface,
            modifier = Modifier.padding(bottom = 0.dp)
        )
        Spacer(
            Modifier
                .weight(1f)
                .height(1.dp)
                .dashedLine(MaterialTheme.colorScheme.outlineVariant),
        )
        if (time != null) {
            Text(
                time,
                fontFamily = FontFamily.Monospace,
                fontSize = 11.sp,
                letterSpacing = 0.3.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(bottom = 0.dp)
            )
        }
    }
}

@Composable
private fun CompletedHeader(
    count: Int,
    isExpanded: Boolean,
    onToggle: () -> Unit,
) {
    val chevronRotation by animateFloatAsState(targetValue = if (isExpanded) 0f else -90f, label = "chevron")
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onToggle() }
            .padding(start = 20.dp, end = 20.dp, top = 24.dp, bottom = 10.dp),
    ) {
        Text(
            "Completed ($count)".uppercase(),
            fontFamily = FontFamily.Monospace,
            fontWeight = FontWeight.Bold,
            fontSize = 13.sp,
            letterSpacing = 1.sp,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.weight(1f),
        )
        Icon(
            imageVector = TablerIcons.ChevronDown,
            contentDescription = if (isExpanded) "Collapse" else "Expand",
            tint = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier
                .rotate(chevronRotation)
                .size(18.dp),
        )
    }
}

