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
import com.hvsna.app.data.isPrayerAnchored
import com.hvsna.app.ui.TaskViewModel
import com.hvsna.app.ui.TodayGroupedTasks
import com.hvsna.app.ui.components.EmptyState
import com.hvsna.app.ui.components.TaskListItem
import com.hvsna.app.ui.groupTodayTasks
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.vectorResource
import com.hvsna.app.R

private val todayHeaderFormat = SimpleDateFormat("EEE, MMM d", Locale.getDefault())
private val timeFormat = SimpleDateFormat("HH:mm", Locale.getDefault())

private sealed class TodayListItem {
    data class PrayerHeader(val name: String, val timeLabel: String?, val dayKey: String) : TodayListItem()
    data class TaskEntry(val entry: TaskWithTags) : TodayListItem()
    data class DayDivider(val label: String) : TodayListItem()
}

// task.scheduledTime for a prayer-pinned task holds the *deadline* (next prayer's start,
// or midnight for Isha) so it can be flagged overdue - not the prayer's own start time.
// Sorting the visible list by that deadline pushes late-window prayers (Isha) toward
// midnight, ahead of unrelated tasks that fall earlier in the evening. Use the prayer's
// actual start time from prayerTimeMap for display ordering instead.
private fun displaySortKey(entry: TaskWithTags, prayerTimeMap: Map<String, Long>): Long {
    val atTime = entry.task.atTime
    return if (atTime != null && isPrayerAnchored(atTime)) prayerTimeMap[atTime] ?: entry.task.scheduledTime ?: Long.MAX_VALUE
    else entry.task.scheduledTime ?: Long.MAX_VALUE
}

private fun buildDayItems(tasks: List<TaskWithTags>, prayerTimeMap: Map<String, Long>, dayKey: String): List<TodayListItem> = buildList {
    val seenPrayers = mutableSetOf<String>()
    for (entry in tasks.sortedBy { displaySortKey(it, prayerTimeMap) }) {
        val atTime = entry.task.atTime
        if (atTime != null && isPrayerAnchored(atTime) && atTime !in seenPrayers) {
            val timeLabel = prayerTimeMap[atTime]?.let { timeFormat.format(Date(it)) }
            add(TodayListItem.PrayerHeader(atTime, timeLabel, dayKey))
            seenPrayers.add(atTime)
        }
        add(TodayListItem.TaskEntry(entry))
    }
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
    val todayEndEpoch = remember(now) {
        Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, 23)
            set(Calendar.MINUTE, 59)
            set(Calendar.SECOND, 59)
            set(Calendar.MILLISECOND, 999)
        }.timeInMillis
    }
    val isAfterMaghrib = prayerTimeMap["Maghrib"]?.let { now >= it } ?: false

    // Once Maghrib has passed, viewModel.todayTasks already extends its fetch window into
    // tomorrow (see TaskViewModel.todayTaskWindowEnd) - pull tomorrow's own prayer times so
    // its section gets correctly-labeled headers instead of reusing today's times.
    val tomorrowPrayerTimeMap = remember(settings, isAfterMaghrib) {
        if (!isAfterMaghrib || !settings.hasLocation) emptyMap()
        else Calendar.getInstance().apply { add(Calendar.DAY_OF_MONTH, 1) }.let {
            viewModel.getPrayerTimesForDate(
                it.get(Calendar.YEAR),
                it.get(Calendar.MONTH) + 1,
                it.get(Calendar.DAY_OF_MONTH),
            ).toMap()
        }
    }
    val tomorrowLabel = remember(now) {
        todayHeaderFormat.format(Calendar.getInstance().apply { add(Calendar.DAY_OF_MONTH, 1) }.time)
    }

    val grouped: TodayGroupedTasks = groupTodayTasks(overdueTasks, todayTasks, now, todayEndEpoch)
    val allOverdueTasks = grouped.overdue
    val flatTodayItems = buildDayItems(grouped.today, prayerTimeMap, dayKey = "today") +
        if (grouped.tomorrow.isNotEmpty()) {
            listOf(TodayListItem.DayDivider(tomorrowLabel)) + buildDayItems(grouped.tomorrow, tomorrowPrayerTimeMap, dayKey = "tomorrow")
        } else {
            emptyList()
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
                                monthOffsets = settings.hijriMonthOffsets,
                                maghribEpochMillis = prayerTimeMap["Maghrib"],
                            ),
                            fontWeight = FontWeight.ExtraBold,
                            fontSize = 12.sp,
                            letterSpacing = 1.sp,
                            color = MaterialTheme.colorScheme.primary,
                        )
                        Text(
                            todayHeaderFormat.format(Date()),
                            modifier = Modifier.padding(top = 6.dp, bottom = 6.dp),
                        )
                    }
                },
                scrollBehavior = scrollBehavior,
                colors = TopAppBarDefaults.largeTopAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface,
                    scrolledContainerColor = MaterialTheme.colorScheme.surface,
                ),
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = { onEditTask(null, defaultScheduledTime) },
                shape = RoundedCornerShape(16.dp),
                containerColor = MaterialTheme.colorScheme.primary,
                contentColor = MaterialTheme.colorScheme.onPrimary,
            ) {
                Icon(ImageVector.vectorResource(id = R.drawable.ic_plus), contentDescription = "Add task")
            }
        },
    ) { innerPadding ->
        if (isEmpty) {
            EmptyState(
                icon = ImageVector.vectorResource(id = R.drawable.ic_list_check),
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
                            showDate = false,
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
                        is TodayListItem.PrayerHeader -> "prayer_${item.dayKey}_${item.name}"
                        is TodayListItem.TaskEntry -> item.entry.task.id
                        is TodayListItem.DayDivider -> "day_divider_${item.label}"
                    }
                },
            ) { item ->
                when (item) {
                    is TodayListItem.PrayerHeader -> PrayerSectionHeader(name = item.name, time = item.timeLabel)
                    is TodayListItem.TaskEntry -> TaskListItem(
                        task = item.entry.task,
                        tags = item.entry.tags,
                        isOverdue = false,
                        inPrayerSection = true,
                        showDate = false,
                        onToggleDone = { viewModel.toggleDone(item.entry.task) },
                        onClick = { onEditTask(item.entry, null) },
                    )
                    is TodayListItem.DayDivider -> DayDivider(label = item.label)
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
                            showDate = false,
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
            imageVector = ImageVector.vectorResource(id = R.drawable.ic_chevron_down),
            contentDescription = if (isExpanded) "Collapse" else "Expand",
            tint = MaterialTheme.colorScheme.error,
            modifier = Modifier
                .rotate(chevronRotation)
                .size(16.dp),
        )
    }
}

private fun prayerIconRes(name: String): Int = when (name) {
    "Fajr" -> R.drawable.ic_sunrise
    "Sunrise" -> R.drawable.ic_sun_low
    "Dhuhr" -> R.drawable.ic_sun
    "Asr" -> R.drawable.ic_sunset
    "Maghrib" -> R.drawable.ic_sunset_2
    "Isha" -> R.drawable.ic_moon
    else -> R.drawable.ic_clock
}

@Composable
private fun PrayerSectionHeader(name: String, time: String?) {
    Row(
        verticalAlignment = Alignment.Bottom,
        modifier = Modifier
            .fillMaxWidth()
            .padding(start = 20.dp, end = 20.dp, top = 40.dp, bottom = 8.dp),
    ) {
        Icon(
            imageVector = ImageVector.vectorResource(id = prayerIconRes(name)),
            contentDescription = null,
            tint = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier
                .padding(end = 6.dp, bottom = 1.dp)
                .size(16.dp),
        )
        Text(
            name,
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
                fontSize = 11.sp,
                letterSpacing = 0.3.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(bottom = 0.dp)
            )
        }
    }
}

/** Separates today's remaining tasks from tomorrow's, shown once the Today window has
 * rolled past Maghrib (see TaskViewModel.todayTaskWindowEnd) - mirrors the web app's
 * TomorrowDivider in today.tsx. */
@Composable
private fun DayDivider(label: String) {
    Row(
        verticalAlignment = Alignment.Bottom,
        modifier = Modifier
            .fillMaxWidth()
            .padding(start = 20.dp, end = 20.dp, top = 32.dp, bottom = 8.dp),
    ) {
        Text(
            label,
            fontWeight = FontWeight.Bold,
            fontSize = 13.sp,
            letterSpacing = 1.sp,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Spacer(
            Modifier
                .weight(1f)
                .padding(start = 8.dp)
                .height(1.dp)
                .dashedLine(MaterialTheme.colorScheme.outlineVariant),
        )
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
            "Completed ($count)",
            fontWeight = FontWeight.Bold,
            fontSize = 13.sp,
            letterSpacing = 1.sp,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.weight(1f),
        )
        Icon(
            imageVector = ImageVector.vectorResource(id = R.drawable.ic_chevron_down),
            contentDescription = if (isExpanded) "Collapse" else "Expand",
            tint = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier
                .rotate(chevronRotation)
                .size(18.dp),
        )
    }
}

