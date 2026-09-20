package com.hvsna.app.ui.screens

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LargeTopAppBar
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.input.nestedscroll.nestedScroll
import com.hvsna.app.data.RecurringType
import com.hvsna.app.data.Tag
import com.hvsna.app.data.TaskWithTags
import com.hvsna.app.ui.TaskViewModel
import com.hvsna.app.ui.components.EmptyState
import com.hvsna.app.ui.components.TaskListItem
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.vectorResource
import com.hvsna.app.R
import com.hvsna.app.i18n.LocalStrings
import com.hvsna.app.i18n.Strings

private fun cadenceLabel(intervalCount: Int, recurringType: String, strings: Strings): String {
    val plural = intervalCount != 1
    val unitKey = when (recurringType) {
        RecurringType.DAILY -> if (plural) "unit.daysLower" else "unit.dayLower"
        RecurringType.WEEKLY -> if (plural) "unit.weeksLower" else "unit.weekLower"
        RecurringType.MONTHLY -> if (plural) "unit.monthsLower" else "unit.monthLower"
        RecurringType.YEARLY -> if (plural) "unit.yearsLower" else "unit.yearLower"
        else -> return recurringType
    }
    return if (plural) {
        strings.format("recurring.cadenceEveryN", intervalCount, strings[unitKey])
    } else {
        strings.format("recurring.cadenceEvery", strings[unitKey])
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RecurringScreen(
    viewModel: TaskViewModel,
    onBack: () -> Unit,
    onTagClick: (Tag) -> Unit = {},
    onEditTask: (TaskWithTags?, Long?) -> Unit,
    onReschedule: (TaskWithTags) -> Unit = {},
    modifier: Modifier = Modifier,
) {
    val strings = LocalStrings.current
    val series by viewModel.recurringSeries.collectAsState()
    val settings by viewModel.settings.collectAsState()

    val scrollBehavior = TopAppBarDefaults.exitUntilCollapsedScrollBehavior()
    val listState = rememberLazyListState()
    val isEmpty = series.isEmpty()
    val canScroll = !isEmpty && (listState.canScrollForward || listState.canScrollBackward)

    Scaffold(
        modifier = modifier
            .fillMaxSize()
            .let { if (canScroll) it.nestedScroll(scrollBehavior.nestedScrollConnection) else it },
        topBar = {
            LargeTopAppBar(
                title = { Text(strings["recurring.title"]) },
                scrollBehavior = scrollBehavior,
                colors = TopAppBarDefaults.largeTopAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface,
                    scrolledContainerColor = MaterialTheme.colorScheme.surface,
                ),
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(ImageVector.vectorResource(id = R.drawable.ic_arrow_left), contentDescription = strings["common.back"])
                    }
                },
            )
        },
    ) { innerPadding ->
        if (isEmpty) {
            EmptyState(
                icon = ImageVector.vectorResource(id = R.drawable.ic_repeat),
                title = strings["recurring.emptyTitle"],
                subtitle = strings["recurring.emptySubtitle"],
                modifier = Modifier.padding(innerPadding),
            )
            return@Scaffold
        }
        LazyColumn(
            state = listState,
            modifier = Modifier.fillMaxSize(),
            contentPadding = innerPadding,
        ) {
            itemsIndexed(series, key = { _, entry -> entry.rule.id }) { index, entry ->
                val cadence = cadenceLabel(entry.rule.recurringInterval, entry.rule.recurringType, strings)
                val displayTask = entry.nextOccurrence.copy(
                    description = if (entry.nextOccurrence.description.isNotEmpty()) {
                        "$cadence · ${entry.nextOccurrence.description}"
                    } else {
                        cadence
                    },
                )
                TaskListItem(
                    task = displayTask,
                    tags = entry.tags,
                    onToggleDone = { viewModel.toggleDone(TaskWithTags(entry.nextOccurrence, entry.tags)) },
                    onClick = { onEditTask(TaskWithTags(entry.nextOccurrence, entry.tags), null) },
                    onReschedule = { onReschedule(TaskWithTags(entry.nextOccurrence, entry.tags)) },
                    showDivider = index != series.lastIndex,
                    hijriMonthOffsets = settings.hijriMonthOffsets,
                    modifier = Modifier.animateItem(),
                )
            }
        }
    }
}
