package com.hvsna.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.PaddingValues
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
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.hvsna.app.data.Tag
import com.hvsna.app.data.Task
import com.hvsna.app.data.isPrayerAnchored
import java.text.SimpleDateFormat
import java.util.Date
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.vectorResource
import com.hvsna.app.R
import com.hvsna.app.i18n.LocalStrings

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
                imageVector = ImageVector.vectorResource(id = R.drawable.ic_check),
                contentDescription = null,
                tint = MaterialTheme.colorScheme.onPrimary,
                modifier = Modifier.size(13.dp),
            )
        }
    }
}

/**
 * Colored tag pill shared by every screen that lists tags (task rows, Browse screen's tag list,
 * the task edit form's selected-tags row). Pass [onClick] to make the pill tappable (e.g.
 * navigating to that tag's detail screen) and [trailingContent] to append e.g. a remove icon.
 *
 * Defaults render the compact pill used inside dense task rows. The Browse screen's standalone
 * tag list passes [fontSize]/[contentPadding] to render a roomier, base-size pill instead.
 */
@Composable
fun TagPill(
    tag: Tag,
    modifier: Modifier = Modifier,
    onClick: (() -> Unit)? = null,
    trailingContent: (@Composable () -> Unit)? = null,
    fontSize: TextUnit = 10.sp,
    contentPadding: PaddingValues = PaddingValues(horizontal = 6.dp),
) {
    val tagColor = Color(tag.color.toInt())
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = modifier
            .clip(RoundedCornerShape(4.dp))
            .background(tagColor.copy(alpha = 0.15f))
            .then(if (onClick != null) Modifier.clickable { onClick() } else Modifier)
            .padding(contentPadding),
    ) {
        Text(
            "#${tag.name}",
            fontSize = fontSize,
            letterSpacing = 0.5.sp,
            color = tagColor,
        )
        if (trailingContent != null) {
            Spacer(Modifier.width(4.dp))
            trailingContent()
        }
    }
}

/**
 * Shared task row used by every task list screen (Today, Upcoming, Search, Completed, Tag detail).
 * [isOverdue] tints the time label red; [inPrayerSection] suppresses the prayer-name label when a
 * prayer section header already shows it (Today screen groups tasks under prayer headers).
 * [showDate] hides the date portion of the label (Today/Upcoming screens already group by date).
 * [showYear] switches the date portion to include the year (Upcoming's later-year groups span
 * more than one year, so the bare "EEE, MMM d" format would be ambiguous there).
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
    showDate: Boolean = true,
    showYear: Boolean = false,
    modifier: Modifier = Modifier,
) {
    val strings = LocalStrings.current
    val timeFormat = remember(strings.locale) { SimpleDateFormat("HH:mm", strings.locale) }
    val dateFormat = remember(strings.locale) { SimpleDateFormat("EEE, MMM d", strings.locale) }
    val dateFormatWithYear = remember(strings.locale) { SimpleDateFormat("EEE, MMM d, yyyy", strings.locale) }

    val done = task.isDone == 1
    val dateLabel = if (showDate) {
        task.scheduledTime?.let { (if (showYear) dateFormatWithYear else dateFormat).format(Date(it)) } ?: ""
    } else ""
    val timeOnlyLabel = when {
        task.atTime.isNullOrBlank() -> ""
        isPrayerAnchored(task.atTime) && inPrayerSection -> ""
        isPrayerAnchored(task.atTime) -> strings["prayer.${task.atTime}"]
        else -> task.scheduledTime?.let { timeFormat.format(Date(it)) } ?: ""
    }
    val timeLabel = when {
        dateLabel.isNotEmpty() && timeOnlyLabel.isNotEmpty() -> "$dateLabel, $timeOnlyLabel"
        dateLabel.isNotEmpty() -> dateLabel
        else -> timeOnlyLabel
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
            }

            if (task.description.isNotEmpty()) {
                Text(
                    task.description,
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(start = leadingColumnWidth, top = 3.dp),
                )
            }

            if (timeLabel.isNotEmpty() || tags.isNotEmpty()) {
                FlowRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalArrangement = Arrangement.spacedBy(4.dp),
                    modifier = Modifier.padding(start = leadingColumnWidth, top = 4.dp),
                ) {
                    if (timeLabel.isNotEmpty()) {
                        Text(
                            timeLabel,
                            fontSize = 11.sp,
                            color = if (isOverdue) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.padding(vertical = 2.dp),
                        )
                    }
                    tags.forEach { tag -> TagPill(tag = tag) }
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
                        atTime = "09:30",
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
                        atTime = "14:00",
                        isDone = 1
                    ),
                    onToggleDone = {},
                    onClick = {}
                )
            }
        }
    }
}
