package com.hvsna.app.ui.screens

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LargeTopAppBar
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.input.nestedscroll.nestedScroll
import com.hvsna.app.data.Tag
import com.hvsna.app.data.TaskWithTags
import com.hvsna.app.ui.TaskViewModel
import com.hvsna.app.ui.components.EmptyState
import com.hvsna.app.ui.components.TaskListItem
import compose.icons.TablerIcons
import compose.icons.tablericons.ArrowLeft
import compose.icons.tablericons.SquareCheck

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CompletedScreen(
    viewModel: TaskViewModel,
    onBack: () -> Unit,
    onTagClick: (Tag) -> Unit = {},
    onEditTask: (TaskWithTags?, Long?) -> Unit,
    modifier: Modifier = Modifier,
) {
    val tasks by viewModel.allCompletedTasks.collectAsState()

    val scrollBehavior = TopAppBarDefaults.exitUntilCollapsedScrollBehavior()
    val listState = rememberLazyListState()
    val isEmpty = tasks.isEmpty()
    val canScroll = !isEmpty && (listState.canScrollForward || listState.canScrollBackward)

    Scaffold(
        modifier = modifier
            .fillMaxSize()
            .let { if (canScroll) it.nestedScroll(scrollBehavior.nestedScrollConnection) else it },
        topBar = {
            LargeTopAppBar(
                title = { Text("Completed") },
                scrollBehavior = scrollBehavior,
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(TablerIcons.ArrowLeft, contentDescription = "Back")
                    }
                },
            )
        },
    ) { innerPadding ->
        if (isEmpty) {
            EmptyState(
                icon = TablerIcons.SquareCheck,
                title = "No completed tasks yet",
                modifier = Modifier.padding(innerPadding),
            )
            return@Scaffold
        }
        LazyColumn(
            state = listState,
            modifier = Modifier.fillMaxSize(),
            contentPadding = innerPadding,
        ) {
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
