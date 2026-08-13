package com.hvsna.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.hvsna.app.data.Tag
import com.hvsna.app.data.Task
import com.hvsna.app.data.isPrayerAnchored
import compose.icons.TablerIcons
import compose.icons.tablericons.Check
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

private val timeFormat = SimpleDateFormat("HH:mm", Locale.getDefault())
private val leadingColumnWidth = 32.dp

@Composable
fun TaskCheckbox(
    checked: Boolean,
    onCheckedChange: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val shape = RoundedCornerShape(4.dp)
    val borderColor = if (checked) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outline
    Box(
        modifier = modifier
            .size(20.dp)
            .clip(shape)
            .background(if (checked) MaterialTheme.colorScheme.primary else Color.Transparent)
            .border(width = 1.dp, color = borderColor, shape = shape)
            .clickable { onCheckedChange() },
        contentAlignment = Alignment.Center,
    ) {
        if (checked) {
            Icon(
                imageVector = TablerIcons.Check,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.onPrimary,
                modifier = Modifier.size(13.dp),
            )
        }
    }
}

/**
 * Shared task row used by every task list screen (Today, Upcoming, Search, Completed, Tag detail).
 * [isOverdue] tints the time label red; [inPrayerSection] suppresses the prayer-name label when a
 * prayer section header already shows it (Today screen groups tasks under prayer headers).
 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun TaskListItem(
    task: Task,
    tags: List<Tag> = emptyList(),
    onToggleDone: () -> Unit,
    onClick: () -> Unit,
    isOverdue: Boolean = false,
    inPrayerSection: Boolean = false,
    modifier: Modifier = Modifier,
) {
    val done = task.isDone == 1
    val timeLabel = when {
        task.atTime == null -> ""
        isPrayerAnchored(task.atTime) && inPrayerSection -> ""
        isPrayerAnchored(task.atTime) -> task.atTime
        else -> task.scheduledTime?.let { timeFormat.format(Date(it)) } ?: ""
    }
    val textColor = if (done) MaterialTheme.colorScheme.onSurfaceVariant else MaterialTheme.colorScheme.onSurface

    Column(modifier = modifier) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .clickable { onClick() }
                .padding(horizontal = 20.dp, vertical = 11.dp),
        ) {
            Row(verticalAlignment = Alignment.Top) {
                TaskCheckbox(
                    checked = done,
                    onCheckedChange = onToggleDone,
                    modifier = Modifier.padding(top = 2.dp),
                )
                Spacer(Modifier.width(12.dp))
                Text(
                    task.title,
                    fontSize = 16.sp,
                    color = textColor,
                    textDecoration = if (done) TextDecoration.LineThrough else null,
                    modifier = Modifier.weight(1f),
                )
                if (timeLabel.isNotEmpty()) {
                    Spacer(Modifier.width(8.dp))
                    Text(
                        timeLabel,
                        fontSize = 11.sp,
                        color = if (isOverdue) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }

            if (task.description.isNotEmpty()) {
                Text(
                    task.description,
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(start = leadingColumnWidth, top = 3.dp),
                )
            }

            if (tags.isNotEmpty()) {
                FlowRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.padding(start = leadingColumnWidth, top = 4.dp),
                ) {
                    tags.forEach { tag ->
                        Text(
                            "#${tag.name}",
                            fontSize = 10.sp,
                            letterSpacing = 0.5.sp,
                            color = Color(tag.color.toInt()),
                        )
                    }
                }
            }
        }
        HorizontalDivider(
            modifier = Modifier.padding(horizontal = 20.dp),
            thickness = 0.5.dp,
            color = MaterialTheme.colorScheme.outlineVariant,
        )
    }
}

@Preview
@Composable
fun TaskListItemPreview() {
    MaterialTheme {
        Surface {
            Column {
                TaskListItem(
                    task = Task(
                        title = "Buy Groceries",
                        description = "Milk, Eggs, Bread, and some fruits for the week",
                        scheduledTime = System.currentTimeMillis(),
                        isDone = 0
                    ),
                    tags = listOf(
                        Tag(name = "Shopping", color = 0xFF4CAF50),
                        Tag(name = "Urgent", color = 0xFFF44336)
                    ),
                    onToggleDone = {},
                    onClick = {}
                )
                TaskListItem(
                    task = Task(
                        title = "Completed Task",
                        description = "This task is already done",
                        scheduledTime = System.currentTimeMillis(),
                        isDone = 1
                    ),
                    onToggleDone = {},
                    onClick = {}
                )
            }
        }
    }
}
