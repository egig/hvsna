package com.hvsna.app.ui.screens

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.ListItem
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.hvsna.app.data.Tag
import com.hvsna.app.data.TaskWithTags
import com.hvsna.app.ui.TaskViewModel
import com.hvsna.app.ui.components.TagPill
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.vectorResource
import com.hvsna.app.R
import com.hvsna.app.i18n.LocalStrings

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
fun BrowseScreen(
    viewModel: TaskViewModel,
    onOpenSettings: () -> Unit,
    onTagClick: (Tag) -> Unit = {},
    onEditTask: (TaskWithTags?, Long?) -> Unit,
    modifier: Modifier = Modifier,
) {
    val strings = LocalStrings.current
    var showCompleted by remember { mutableStateOf(false) }
    var showRecurring by remember { mutableStateOf(false) }

    if (showCompleted) {
        CompletedScreen(
            viewModel = viewModel,
            onBack = { showCompleted = false },
            onTagClick = onTagClick,
            onEditTask = onEditTask,
            modifier = modifier,
        )
        return
    }

    if (showRecurring) {
        RecurringScreen(
            viewModel = viewModel,
            onBack = { showRecurring = false },
            onTagClick = onTagClick,
            onEditTask = onEditTask,
            modifier = modifier,
        )
        return
    }

    val tags by viewModel.allTags.collectAsState()

    Scaffold(
        modifier = modifier.fillMaxSize(),
        topBar = {
            TopAppBar(
                title = {},
                actions = {
                    IconButton(onClick = onOpenSettings) {
                        Icon(ImageVector.vectorResource(id = R.drawable.ic_settings), contentDescription = strings["a11y.settings"])
                    }
                },
            )
        },
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = innerPadding,
        ) {
            item {
                ListItem(
                    headlineContent = { Text(strings["browse.recurring"], style = MaterialTheme.typography.bodyLarge) },
                    leadingContent = { Icon(ImageVector.vectorResource(id = R.drawable.ic_repeat), contentDescription = null) },
                    trailingContent = { Icon(ImageVector.vectorResource(id = R.drawable.ic_chevron_right), contentDescription = null) },
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { showRecurring = true },
                )
            }

            item {
                ListItem(
                    headlineContent = { Text(strings["browse.completed"], style = MaterialTheme.typography.bodyLarge) },
                    leadingContent = { Icon(ImageVector.vectorResource(id = R.drawable.ic_square_check), contentDescription = null) },
                    trailingContent = { Icon(ImageVector.vectorResource(id = R.drawable.ic_chevron_right), contentDescription = null) },
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { showCompleted = true },
                )
            }

            if (tags.isNotEmpty()) {
                item {
                    Text(
                        strings["browse.tags"],
                        style = MaterialTheme.typography.labelLarge,
                        color = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.padding(start = 16.dp, top = 16.dp, bottom = 8.dp),
                    )
                }

                item {
                    FlowRow(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 12.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        tags.forEach { tag ->
                            TagPill(
                                tag = tag,
                                onClick = { onTagClick(tag) },
                                fontSize = MaterialTheme.typography.bodyMedium.fontSize,
                                contentPadding = PaddingValues(horizontal = 8.dp, vertical = 2.dp),
                            )
                        }
                    }
                }
            } else {
                item {
                    Text(
                        strings["browse.noTags"],
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 16.dp),
                    )
                }
            }
        }
    }
}
