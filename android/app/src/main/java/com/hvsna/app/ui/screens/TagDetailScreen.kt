package com.hvsna.app.ui.screens

import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LargeTopAppBar
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.compose.ui.unit.dp
import com.hvsna.app.data.Tag
import com.hvsna.app.data.TaskWithTags
import com.hvsna.app.ui.TaskViewModel
import com.hvsna.app.ui.components.EmptyState
import com.hvsna.app.ui.components.SectionHeader
import com.hvsna.app.ui.components.TagEditBottomSheet
import com.hvsna.app.ui.components.TaskListItem
import kotlinx.coroutines.flow.collectLatest
import java.util.Calendar
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.vectorResource
import com.hvsna.app.R

@OptIn(ExperimentalMaterial3Api::class, ExperimentalFoundationApi::class)
@Composable
fun TagDetailScreen(
    viewModel: TaskViewModel,
    tag: Tag,
    onBack: () -> Unit,
    onEditTask: (TaskWithTags?, Long?) -> Unit,
    modifier: Modifier = Modifier,
) {
    var tasks by remember(tag.id) { mutableStateOf<List<TaskWithTags>>(emptyList()) }
    val flow = remember(tag.id) { viewModel.tasksForTag(tag.id) }
    LaunchedEffect(flow) {
        flow.collectLatest { tasks = it }
    }

    val todayStart = remember {
        Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }.timeInMillis
    }
    val tomorrowStart = todayStart + 86_400_000L

    val overdue = tasks.filter { it.task.scheduledTime != null && it.task.scheduledTime < todayStart }
        .sortedBy { it.task.scheduledTime }
    val today = tasks.filter { it.task.scheduledTime != null && it.task.scheduledTime in todayStart until tomorrowStart }
        .sortedBy { it.task.scheduledTime }
    val upcoming = tasks.filter { it.task.scheduledTime != null && it.task.scheduledTime >= tomorrowStart }
        .sortedBy { it.task.scheduledTime }
    val unscheduled = tasks.filter { it.task.scheduledTime == null }
        .sortedBy { it.task.title }

    val scrollBehavior = TopAppBarDefaults.exitUntilCollapsedScrollBehavior()
    val expandedGroups = remember {
        mutableStateMapOf("Overdue" to true, "Today" to true, "Upcoming" to true, "Unscheduled" to true)
    }
    var showEditTagSheet by remember { mutableStateOf(false) }
    val editTagSheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    val listState = rememberLazyListState()
    val isEmpty = overdue.isEmpty() && today.isEmpty() && upcoming.isEmpty() && unscheduled.isEmpty()
    val canScroll = !isEmpty && (listState.canScrollForward || listState.canScrollBackward)

    Scaffold(
        modifier = modifier
            .fillMaxSize()
            .let { if (canScroll) it.nestedScroll(scrollBehavior.nestedScrollConnection) else it },
        topBar = {
            LargeTopAppBar(
                title = {
                    Text("#" + tag.name, modifier = Modifier.padding(start = 8.dp), color = Color(tag.color.toInt()))
                },
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
                actions = {
                    IconButton(onClick = { showEditTagSheet = true }) {
                        Icon(ImageVector.vectorResource(id = R.drawable.ic_pencil), contentDescription = "Edit tag")
                    }
                },
            )
        },
    ) { innerPadding ->
        if (isEmpty) {
            EmptyState(
                icon = ImageVector.vectorResource(id = R.drawable.ic_hash),
                title = "No tasks with this tag",
                modifier = Modifier.padding(innerPadding),
            )
            return@Scaffold
        }
        LazyColumn(
            state = listState,
            modifier = Modifier.fillMaxSize(),
            contentPadding = innerPadding,
        ) {
            listOf(
                "Overdue" to overdue,
                "Today" to today,
                "Upcoming" to upcoming,
                "Unscheduled" to unscheduled,
            ).forEach { (label, entries) ->
                if (entries.isNotEmpty()) {
                    val isExpanded = expandedGroups[label] == true
                    stickyHeader(key = "header_$label") {
                        SectionHeader(
                            label = label,
                            isExpanded = isExpanded,
                            onToggle = { expandedGroups[label] = !isExpanded },
                            color = if (label == "Overdue") MaterialTheme.colorScheme.error
                            else MaterialTheme.colorScheme.onSurface,
                            background = MaterialTheme.colorScheme.surface,
                        )
                    }
                    if (isExpanded) {
                        items(entries, key = { it.task.id }) { entry ->
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

    if (showEditTagSheet) {
        TagEditBottomSheet(
            tag = tag,
            sheetState = editTagSheetState,
            onDismiss = { showEditTagSheet = false },
            onSave = { viewModel.updateTag(it) },
            onDelete = {
                viewModel.deleteTag(it)
                onBack()
            },
        )
    }
}
