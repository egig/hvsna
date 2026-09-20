package com.hvsna.app.ui.components

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
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
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.SwipeToDismissBox
import androidx.compose.material3.SwipeToDismissBoxValue
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.rememberSwipeToDismissBoxState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.text.TextLayoutResult
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.hvsna.app.data.Tag
import com.hvsna.app.data.Task
import com.hvsna.app.data.combinedDateLabel
import com.hvsna.app.data.isPrayerAnchored
import java.text.SimpleDateFormat
import java.util.Date
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.vectorResource
import com.hvsna.app.R
import com.hvsna.app.i18n.LocalStrings
import com.hvsna.app.ui.theme.LocalDarkTheme
import com.hvsna.app.ui.theme.SwipeCompleteBackgroundDark
import com.hvsna.app.ui.theme.SwipeCompleteOnBackgroundDark
import com.hvsna.app.ui.theme.SwipeRescheduleBackgroundDark
import com.hvsna.app.ui.theme.SwipeRescheduleOnBackgroundDark
import com.hvsna.app.ui.theme.accessibleColor

private val leadingColumnWidth = 32.dp

@Composable
fun TaskCheckbox(
    checked: Boolean,
    onCheckedChange: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val shape = RoundedCornerShape(4.dp)
    val primary = MaterialTheme.colorScheme.primary
    val fill by animateColorAsState(
        targetValue = if (checked) primary else Color.Transparent,
        animationSpec = tween(150),
        label = "checkboxFill",
    )
    val borderColor by animateColorAsState(
        targetValue = if (checked) primary else MaterialTheme.colorScheme.outline,
        animationSpec = tween(150),
        label = "checkboxBorder",
    )
    // Springs past 1 on check for a small "pop"; eases straight back down on uncheck.
    val tick by animateFloatAsState(
        targetValue = if (checked) 1f else 0f,
        animationSpec = if (checked) {
            spring(dampingRatio = 0.45f, stiffness = Spring.StiffnessMedium)
        } else {
            tween(120)
        },
        label = "checkboxTick",
    )
    Box(
        modifier = modifier
            .size(20.dp)
            .clip(shape)
            .background(fill)
            .border(width = 1.dp, color = borderColor, shape = shape)
            .clickable { onCheckedChange() },
        contentAlignment = Alignment.Center,
    ) {
        Icon(
            imageVector = ImageVector.vectorResource(id = R.drawable.ic_check),
            contentDescription = null,
            tint = MaterialTheme.colorScheme.onPrimary,
            modifier = Modifier
                .size(13.dp)
                .graphicsLayer {
                    scaleX = tick
                    scaleY = tick
                    alpha = tick.coerceIn(0f, 1f)
                },
        )
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
    val tagColor = tag.accessibleColor()
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
@OptIn(ExperimentalLayoutApi::class, ExperimentalMaterial3Api::class)
@Composable
fun TaskListItem(
    task: Task,
    tags: List<Tag> = emptyList(),
    onToggleDone: () -> Unit,
    onClick: () -> Unit,
    onReschedule: () -> Unit = {},
    isOverdue: Boolean = false,
    inPrayerSection: Boolean = false,
    showDate: Boolean = true,
    showYear: Boolean = false,
    showDivider: Boolean = true,
    hijriMonthOffsets: Map<Int, Int> = emptyMap(),
    modifier: Modifier = Modifier,
) {
    val strings = LocalStrings.current
    val timeFormat = remember(strings.locale) { SimpleDateFormat("HH:mm", strings.locale) }
    val weekdayFormat = remember(strings.locale) { SimpleDateFormat("EEE", strings.locale) }

    val done = task.isDone == 1
    val dateLabel = if (showDate) {
        task.scheduledTime?.let {
            val weekday = weekdayFormat.format(Date(it))
            val combined = combinedDateLabel(it, hijriMonthOffsets, strings = strings, includeYear = showYear)
            "$weekday, $combined"
        } ?: ""
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
    val textColor by animateColorAsState(
        targetValue = if (done) MaterialTheme.colorScheme.onSurfaceVariant else MaterialTheme.colorScheme.onSurface,
        animationSpec = tween(220),
        label = "taskTitleColor",
    )
    // Strike-through is drawn by hand (per text line) so it sweeps across the title instead of
    // snapping on; snaps straight to full when a row mounts already-done.
    val strike by animateFloatAsState(
        targetValue = if (done) 1f else 0f,
        animationSpec = tween(durationMillis = 220, easing = FastOutSlowInEasing),
        label = "taskTitleStrike",
    )
    val strikeColor = MaterialTheme.colorScheme.onSurfaceVariant
    var titleLayout by remember { mutableStateOf<TextLayoutResult?>(null) }

    // Swipe right marks the task complete (same toggle the checkbox drives); swipe left opens the
    // reschedule sheet. Neither commits an actual dismissal — confirmValueChange fires the action
    // and always returns false, so the row springs back to Settled instead of leaving the list.
    val dismissState = rememberSwipeToDismissBoxState(
        confirmValueChange = { value ->
            when (value) {
                SwipeToDismissBoxValue.StartToEnd -> onToggleDone()
                SwipeToDismissBoxValue.EndToStart -> onReschedule()
                SwipeToDismissBoxValue.Settled -> {}
            }
            false
        },
    )

    val isDarkTheme = LocalDarkTheme.current

    SwipeToDismissBox(
        state = dismissState,
        modifier = modifier,
        backgroundContent = {
            val spec = when (dismissState.dismissDirection) {
                SwipeToDismissBoxValue.StartToEnd -> SwipeBackgroundSpec(
                    color = if (isDarkTheme) SwipeCompleteBackgroundDark else MaterialTheme.colorScheme.primary,
                    onColor = if (isDarkTheme) SwipeCompleteOnBackgroundDark else MaterialTheme.colorScheme.onPrimary,
                    icon = R.drawable.ic_square_check_filled,
                    alignment = Alignment.CenterStart,
                    contentDescription = strings["a11y.completeTaskSwipe"],
                )
                SwipeToDismissBoxValue.EndToStart -> SwipeBackgroundSpec(
                    color = if (isDarkTheme) SwipeRescheduleBackgroundDark else MaterialTheme.colorScheme.tertiary,
                    onColor = if (isDarkTheme) SwipeRescheduleOnBackgroundDark else MaterialTheme.colorScheme.onTertiary,
                    icon = R.drawable.ic_calendar_event,
                    alignment = Alignment.CenterEnd,
                    contentDescription = strings["a11y.rescheduleTaskSwipe"],
                )
                SwipeToDismissBoxValue.Settled -> null
            }
            if (spec != null) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(spec.color)
                        .padding(horizontal = 24.dp),
                    contentAlignment = spec.alignment,
                ) {
                    Icon(
                        imageVector = ImageVector.vectorResource(id = spec.icon),
                        contentDescription = spec.contentDescription,
                        tint = spec.onColor,
                    )
                }
            }
        },
    ) {
        Column {
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
                        onTextLayout = { titleLayout = it },
                        modifier = Modifier
                            .weight(1f)
                            .drawWithContent {
                                drawContent()
                                val layout = titleLayout
                                if (strike <= 0f || layout == null) return@drawWithContent
                                val lineWidths = (0 until layout.lineCount).map {
                                    layout.getLineRight(it) - layout.getLineLeft(it)
                                }
                                val total = lineWidths.sum()
                                if (total <= 0f) return@drawWithContent
                                var budget = total * strike
                                val stroke = 1.5.dp.toPx()
                                for (line in 0 until layout.lineCount) {
                                    if (budget <= 0f) break
                                    val seg = minOf(budget, lineWidths[line])
                                    val left = layout.getLineLeft(line)
                                    val y = (layout.getLineTop(line) + layout.getLineBottom(line)) / 2f
                                    drawLine(
                                        color = strikeColor,
                                        start = Offset(left, y),
                                        end = Offset(left + seg, y),
                                        strokeWidth = stroke,
                                    )
                                    budget -= lineWidths[line]
                                }
                            },
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
                                fontSize = 12.sp,
                                color = if (isOverdue) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.onSurfaceVariant,
                                modifier = Modifier.padding(vertical = 2.dp),
                            )
                        }
                        tags.forEach { tag -> TagPill(tag = tag) }
                    }
                }
            }
            if (showDivider) {
                HorizontalDivider(
                    modifier = Modifier.padding(horizontal = 20.dp),
                    thickness = 0.5.dp,
                    color = MaterialTheme.colorScheme.outlineVariant,
                )
            }
        }
    }
}

/** Icon/color spec for the surface revealed behind a [TaskListItem] mid-swipe. */
private data class SwipeBackgroundSpec(
    val color: Color,
    val onColor: Color,
    val icon: Int,
    val alignment: Alignment,
    val contentDescription: String?,
)

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
