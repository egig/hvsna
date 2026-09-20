package com.hvsna.app.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
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
import com.hvsna.app.ui.components.SectionHeader
import com.hvsna.app.ui.components.TaskListItem
import com.hvsna.app.ui.groupTodayTasks
import java.text.SimpleDateFormat
import java.time.LocalDate
import java.util.Calendar
import java.util.Date
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.vectorResource
import com.hvsna.app.R
import com.hvsna.app.i18n.LocalStrings

private sealed class TodayListItem {
    data class PrayerHeader(
        val name: String,
        val timeLabel: String?,
        val dayKey: String,
        val groupKey: String,
    ) : TodayListItem()
    /** [groupKey] is the owning prayer section's key, or null for a free-time / end-of-day task
     * that stands on its own with no collapsible header. */
    data class TaskEntry(val entry: TaskWithTags, val groupKey: String?) : TodayListItem()
    data class DayDivider(val label: String, val leadingNote: String? = null) : TodayListItem()
    /** The Hijri-day rollover marker inserted just before the Maghrib section, mirroring
     * the web app's SunsetHairline in today.tsx. [label] is the next Hijri day (the one
     * that begins at Maghrib); [leadingNote] is shown above the line only when nothing is
     * scheduled before sunset. */
    data class SunsetHairline(val label: String, val leadingNote: String?) : TodayListItem()
}

/** Mirrors the web app's getPrayerTimeDisplay: "Dhuhr (12:15)" when the prayer time is known,
 * bare "Dhuhr" otherwise. [name] is already localized by the caller. */
private fun prayerHeaderLabel(name: String, timeLabel: String?): String =
    if (timeLabel != null) "$name ($timeLabel)" else name

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

private fun buildDayItems(
    tasks: List<TaskWithTags>,
    prayerTimeMap: Map<String, Long>,
    dayKey: String,
    timeFormat: SimpleDateFormat,
): List<TodayListItem> = buildList {
    val seenPrayers = mutableSetOf<String>()
    for (entry in tasks.sortedBy { displaySortKey(it, prayerTimeMap) }) {
        val atTime = entry.task.atTime
        val isPrayer = atTime != null && isPrayerAnchored(atTime)
        val groupKey = if (isPrayer) "prayer_${dayKey}_$atTime" else null
        if (isPrayer && atTime !in seenPrayers) {
            val timeLabel = prayerTimeMap[atTime]?.let { timeFormat.format(Date(it)) }
            add(TodayListItem.PrayerHeader(atTime!!, timeLabel, dayKey, groupKey!!))
            seenPrayers.add(atTime)
        }
        add(TodayListItem.TaskEntry(entry, groupKey))
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
    onReschedule: (TaskWithTags) -> Unit = {},
    modifier: Modifier = Modifier,
) {
    val strings = LocalStrings.current
    val todayHeaderFormat = remember(strings.locale) { SimpleDateFormat("EEEE, d MMM", strings.locale) }
    val dayDividerFormat = remember(strings.locale) { SimpleDateFormat("EEE, d MMM", strings.locale) }
    val timeFormat = remember(strings.locale) { SimpleDateFormat("HH:mm", strings.locale) }
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
    val tomorrowLabel = remember(now, dayDividerFormat) {
        dayDividerFormat.format(Calendar.getInstance().apply { add(Calendar.DAY_OF_MONTH, 1) }.time)
    }
    // The Hijri day that begins at tonight's Maghrib — labels the sunset hairline.
    // Mirrors use-today.ts's nextHijriLabel (getTomorrow()).
    val nextHijriLabel = remember(settings.hijriMonthOffsets, strings) {
        hijriDateLabel(LocalDate.now().plusDays(1), settings.hijriMonthOffsets, strings)
    }

    val grouped: TodayGroupedTasks = groupTodayTasks(overdueTasks, todayTasks, now, todayEndEpoch)
    val allOverdueTasks = grouped.overdue

    // Today's items, with the sunset hairline spliced in just before the first Maghrib
    // section (only while sunset is still ahead — once it's passed, the DayDivider takes over).
    val todayDayItems = run {
        val items = buildDayItems(grouped.today, prayerTimeMap, dayKey = "today", timeFormat)
        val maghribIdx = if (isAfterMaghrib) -1
        else items.indexOfFirst { it is TodayListItem.PrayerHeader && it.name == "Maghrib" }
        if (maghribIdx < 0) return@run items
        val leadingNote =
            if (maghribIdx == 0 && allOverdueTasks.isEmpty()) strings["today.noTasksUntilSunset"] else null
        items.take(maghribIdx) +
            TodayListItem.SunsetHairline(nextHijriLabel, leadingNote) +
            items.drop(maghribIdx)
    }

    val flatTodayItems = todayDayItems +
        if (grouped.tomorrow.isNotEmpty()) {
            val note = if (todayDayItems.isEmpty()) strings["today.noTasksUntilTomorrow"] else null
            listOf(TodayListItem.DayDivider(tomorrowLabel, note)) +
                buildDayItems(grouped.tomorrow, tomorrowPrayerTimeMap, dayKey = "tomorrow", timeFormat)
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
                                strings = strings,
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
    ) { innerPadding ->
        if (isEmpty) {
            EmptyState(
                icon = ImageVector.vectorResource(id = R.drawable.ic_list_check),
                title = strings["today.emptyTitle"],
                subtitle = strings["today.emptySubtitle"],
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
                    SectionHeader(
                        label = strings["group.overdue"],
                        isExpanded = isExpanded,
                        onToggle = { expandedGroups["Overdue"] = !isExpanded },
                        color = MaterialTheme.colorScheme.error,
                        background = MaterialTheme.colorScheme.surface,
                    )
                }
                if (isExpanded) {
                    itemsIndexed(allOverdueTasks, key = { _, entry -> entry.task.id }) { index, entry ->
                        TaskListItem(
                            task = entry.task,
                            tags = entry.tags,
                            isOverdue = true,
                            inPrayerSection = false,
                            showDate = false,
                            onToggleDone = { viewModel.toggleDone(entry) },
                            onClick = { onEditTask(entry, null) },
                            onReschedule = { onReschedule(entry) },
                            showDivider = index != allOverdueTasks.lastIndex,
                            modifier = Modifier.animateItem(),
                        )
                    }
                }
            }

            val visibleTodayItems = flatTodayItems.filter { item ->
                item !is TodayListItem.TaskEntry ||
                    item.groupKey == null ||
                    expandedGroups[item.groupKey] != false
            }
            itemsIndexed(
                visibleTodayItems,
                key = { _, item ->
                    when (item) {
                        is TodayListItem.PrayerHeader -> item.groupKey
                        is TodayListItem.TaskEntry -> item.entry.task.id
                        is TodayListItem.DayDivider -> "day_divider_${item.label}"
                        is TodayListItem.SunsetHairline -> "sunset_hairline"
                    }
                },
            ) { index, item ->
                val itemModifier = Modifier.animateItem()
                when (item) {
                    is TodayListItem.PrayerHeader -> {
                        val isExpanded = expandedGroups[item.groupKey] != false
                        SectionHeader(
                            label = prayerHeaderLabel(strings["prayer.${item.name}"], item.timeLabel),
                            isExpanded = isExpanded,
                            onToggle = { expandedGroups[item.groupKey] = !isExpanded },
                            color = MaterialTheme.colorScheme.onSurface,
                            modifier = itemModifier,
                        )
                    }
                    is TodayListItem.TaskEntry -> {
                        val nextItem = visibleTodayItems.getOrNull(index + 1)
                        val isLastInGroup = nextItem !is TodayListItem.TaskEntry || nextItem.groupKey != item.groupKey
                        TaskListItem(
                            task = item.entry.task,
                            tags = item.entry.tags,
                            isOverdue = false,
                            inPrayerSection = true,
                            showDate = false,
                            onToggleDone = { viewModel.toggleDone(item.entry) },
                            onClick = { onEditTask(item.entry, null) },
                            onReschedule = { onReschedule(item.entry) },
                            showDivider = !isLastInGroup,
                            modifier = itemModifier,
                        )
                    }
                    is TodayListItem.DayDivider -> DayDivider(
                        label = item.label,
                        leadingNote = item.leadingNote,
                        modifier = itemModifier,
                    )
                    is TodayListItem.SunsetHairline -> SunsetHairline(
                        label = item.label,
                        leadingNote = item.leadingNote,
                        modifier = itemModifier,
                    )
                }
            }

            if (completedTasks.isNotEmpty()) {
                val isExpanded = expandedGroups["Completed"] == true
                stickyHeader(key = "header_Completed") {
                    SectionHeader(
                        label = strings["group.completed"],
                        isExpanded = isExpanded,
                        onToggle = { expandedGroups["Completed"] = !isExpanded },
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        count = completedTasks.size,
                        background = MaterialTheme.colorScheme.surface,
                    )
                }
                if (isExpanded) {
                    itemsIndexed(completedTasks, key = { _, entry -> entry.task.id }) { index, entry ->
                        TaskListItem(
                            task = entry.task,
                            tags = entry.tags,
                            isOverdue = false,
                            inPrayerSection = false,
                            showDate = false,
                            onToggleDone = { viewModel.toggleDone(entry) },
                            onClick = { onEditTask(entry, null) },
                            onReschedule = { onReschedule(entry) },
                            showDivider = index != completedTasks.lastIndex,
                            modifier = Modifier.animateItem(),
                        )
                    }
                }
            }
        }
    }
}

// Warm dusk accent for the sunset hairline (web today.tsx uses #dd7d5f, same in both themes).
private val SunsetAccent = Color(0xFFDD7D5F)

/** The "No more tasks until …" line the web app shows above a divider when nothing at all
 * precedes it (today.tsx). */
@Composable
private fun DividerLeadingNote(text: String) {
    Text(
        "$text.",
        fontSize = 15.sp,
        color = MaterialTheme.colorScheme.onSurfaceVariant,
        modifier = Modifier.padding(horizontal = 20.dp, vertical = 12.dp),
    )
}

/** Separates today's remaining tasks from tomorrow's, shown once the Today window has
 * rolled past Maghrib (see TaskViewModel.todayTaskWindowEnd) - mirrors the web app's
 * TomorrowDivider in today.tsx. */
@Composable
private fun DayDivider(label: String, leadingNote: String? = null, modifier: Modifier = Modifier) {
    Column(modifier = modifier) {
    if (leadingNote != null) DividerLeadingNote(leadingNote)
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
}

/** The Hijri-day rollover marker shown just before the Maghrib section while sunset is
 * still ahead - mirrors the web app's SunsetHairline in today.tsx. */
@Composable
private fun SunsetHairline(label: String, leadingNote: String?, modifier: Modifier = Modifier) {
    Column(modifier = modifier) {
    if (leadingNote != null) DividerLeadingNote(leadingNote)
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp, vertical = 14.dp),
    ) {
        Spacer(
            Modifier
                .weight(1f)
                .height(1.dp)
                .dashedLine(MaterialTheme.colorScheme.outlineVariant),
        )
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            Icon(
                ImageVector.vectorResource(id = R.drawable.ic_sunset_2),
                contentDescription = null,
                tint = SunsetAccent,
                modifier = Modifier.size(20.dp),
            )
            Text(
                label,
                fontWeight = FontWeight.Bold,
                fontSize = 13.sp,
                letterSpacing = 1.sp,
                color = SunsetAccent,
            )
        }
        Spacer(
            Modifier
                .weight(1f)
                .height(1.dp)
                .dashedLine(MaterialTheme.colorScheme.outlineVariant),
        )
    }
    }
}

/** Rendered outside [TodayScreen]'s own Scaffold (see MainActivity's SyncPullToRefreshBox) so
 * the FAB stays pinned in place rather than stretching along with pull-to-refresh. */
@Composable
fun TodayScreenFab(onEditTask: (TaskWithTags?, Long?) -> Unit) {
    val strings = LocalStrings.current
    val defaultScheduledTime = remember {
        Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, 23)
            set(Calendar.MINUTE, 59)
            set(Calendar.SECOND, 59)
            set(Calendar.MILLISECOND, 999)
        }.timeInMillis
    }
    FloatingActionButton(
        onClick = { onEditTask(null, defaultScheduledTime) },
        shape = RoundedCornerShape(16.dp),
        containerColor = MaterialTheme.colorScheme.primary,
        contentColor = MaterialTheme.colorScheme.onPrimary,
    ) {
        Icon(ImageVector.vectorResource(id = R.drawable.ic_plus), contentDescription = strings["a11y.addTask"])
    }
}

