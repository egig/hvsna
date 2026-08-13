package com.hvsna.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.ListItem
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.hvsna.app.data.hijriDateParts
import com.hvsna.app.data.hijriDayOfMonth
import compose.icons.TablerIcons
import compose.icons.tablericons.ChevronLeft
import compose.icons.tablericons.ChevronRight
import java.time.LocalDate
import java.time.YearMonth
import java.time.format.DateTimeFormatter
import java.time.format.TextStyle
import java.time.temporal.WeekFields
import java.util.Locale

@Composable
fun HijriDatePicker(
    initialDate: LocalDate,
    hijriAdjustment: Int,
    onDateSelected: (LocalDate) -> Unit,
    modifier: Modifier = Modifier,
    locale: Locale = Locale.getDefault(),
) {
    var displayedMonth by remember { mutableStateOf(YearMonth.from(initialDate)) }
    var showMonthList by remember { mutableStateOf(false) }

    if (showMonthList) {
        MonthListPane(
            onMonthSelected = {
                displayedMonth = it
                showMonthList = false
            },
            locale = locale,
            modifier = modifier,
        )
    } else {
        MonthGridPane(
            displayedMonth = displayedMonth,
            selectedDate = initialDate,
            hijriAdjustment = hijriAdjustment,
            onMonthChange = { displayedMonth = it },
            onHeaderClick = { showMonthList = true },
            onDateSelected = { date ->
                displayedMonth = YearMonth.from(date)
                onDateSelected(date)
            },
            locale = locale,
            modifier = modifier,
        )
    }
}

@Composable
private fun MonthGridPane(
    displayedMonth: YearMonth,
    selectedDate: LocalDate,
    hijriAdjustment: Int,
    onMonthChange: (YearMonth) -> Unit,
    onHeaderClick: () -> Unit,
    onDateSelected: (LocalDate) -> Unit,
    locale: Locale,
    modifier: Modifier = Modifier,
) {
    val today = LocalDate.now()
    val firstDayOfWeek = WeekFields.of(locale).firstDayOfWeek
    val firstOfMonth = displayedMonth.atDay(1)
    val leadingDays = (firstOfMonth.dayOfWeek.value - firstDayOfWeek.value + 7) % 7
    val gridStart = firstOfMonth.minusDays(leadingDays.toLong())
    val totalDays = displayedMonth.lengthOfMonth() + leadingDays
    val weeks = (totalDays + 6) / 7

    val weekdayLabels = (0 until 7).map { offset ->
        firstDayOfWeek.plus(offset.toLong()).getDisplayName(TextStyle.SHORT, locale)
    }

    val hijriRangeStart = hijriDateParts(firstOfMonth, hijriAdjustment)
    val hijriRangeEnd = hijriDateParts(displayedMonth.atEndOfMonth(), hijriAdjustment)
    val hijriRangeLabel = "${hijriRangeStart.day} ${hijriRangeStart.monthName} – " +
        "${hijriRangeEnd.day} ${hijriRangeEnd.monthName}"

    Column(modifier = modifier.fillMaxWidth()) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.fillMaxWidth(),
        ) {
            IconButton(onClick = { onMonthChange(displayedMonth.minusMonths(1)) }) {
                Icon(TablerIcons.ChevronLeft, contentDescription = "Previous month")
            }
            Text(
                displayedMonth.format(DateTimeFormatter.ofPattern("MMMM yyyy", locale)),
                style = MaterialTheme.typography.titleMedium,
                textAlign = TextAlign.Center,
                modifier = Modifier
                    .weight(1f)
                    .clickable { onHeaderClick() },
            )
            IconButton(onClick = { onMonthChange(displayedMonth.plusMonths(1)) }) {
                Icon(TablerIcons.ChevronRight, contentDescription = "Next month")
            }
        }

        Text(
            hijriRangeLabel,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center,
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 4.dp),
        )

        Row(modifier = Modifier.fillMaxWidth()) {
            weekdayLabels.forEach { label ->
                Text(
                    label,
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.weight(1f),
                )
            }
        }

        for (week in 0 until weeks) {
            Row(modifier = Modifier.fillMaxWidth()) {
                for (dayOfWeek in 0 until 7) {
                    val date = gridStart.plusDays((week * 7 + dayOfWeek).toLong())
                    DayCell(
                        date = date,
                        hijriAdjustment = hijriAdjustment,
                        isCurrentMonth = YearMonth.from(date) == displayedMonth,
                        isSelected = date == selectedDate,
                        isToday = date == today,
                        onClick = { onDateSelected(date) },
                        modifier = Modifier.weight(1f),
                    )
                }
            }
        }

        Row(
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 8.dp),
        ) {
            OutlinedButton(
                onClick = { onDateSelected(today) },
                modifier = Modifier.weight(1f),
            ) {
                Text("Today")
            }
            OutlinedButton(
                onClick = { onDateSelected(today.plusDays(1)) },
                modifier = Modifier.weight(1f),
            ) {
                Text("Tomorrow")
            }
        }
    }
}

@Composable
private fun DayCell(
    date: LocalDate,
    hijriAdjustment: Int,
    isCurrentMonth: Boolean,
    isSelected: Boolean,
    isToday: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val contentColor = when {
        isSelected -> MaterialTheme.colorScheme.onPrimary
        !isCurrentMonth -> MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.4f)
        else -> MaterialTheme.colorScheme.onSurface
    }
    val hijriColor = when {
        isSelected -> MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.8f)
        !isCurrentMonth -> MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.3f)
        else -> MaterialTheme.colorScheme.onSurfaceVariant
    }

    Box(
        contentAlignment = Alignment.Center,
        modifier = modifier
            .aspectRatio(1f)
            .padding(2.dp)
            .clip(CircleShape)
            .then(
                when {
                    isSelected -> Modifier.background(MaterialTheme.colorScheme.primary, CircleShape)
                    isToday -> Modifier.background(MaterialTheme.colorScheme.secondaryContainer, CircleShape)
                    else -> Modifier
                }
            )
            .clickable { onClick() },
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(date.dayOfMonth.toString(), style = MaterialTheme.typography.bodyMedium, color = contentColor)
            Text(
                hijriDayOfMonth(date, hijriAdjustment).toString(),
                style = MaterialTheme.typography.labelSmall,
                color = hijriColor,
            )
        }
    }
}

@Composable
private fun MonthListPane(
    onMonthSelected: (YearMonth) -> Unit,
    locale: Locale,
    modifier: Modifier = Modifier,
) {
    val currentMonth = remember { YearMonth.now() }
    val months = remember {
        val start = currentMonth.minusYears(2)
        val end = currentMonth.plusYears(2)
        generateSequence(start) { it.plusMonths(1) }.takeWhile { !it.isAfter(end) }.toList()
    }
    val formatter = remember(locale) { DateTimeFormatter.ofPattern("MMMM yyyy", locale) }

    LazyColumn(modifier = modifier.height(320.dp)) {
        items(months) { month ->
            ListItem(
                headlineContent = { Text(month.format(formatter)) },
                modifier = Modifier.clickable { onMonthSelected(month) },
            )
            HorizontalDivider()
        }
    }
}
