package com.hvsna.app.ui.components

import android.app.TimePickerDialog
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.ListItem
import androidx.compose.material3.LocalTextStyle
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.SheetState
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Popup
import androidx.compose.ui.window.PopupProperties
import com.hvsna.app.data.RecurrenceInput
import com.hvsna.app.data.RecurrenceRule
import com.hvsna.app.data.RecurringEnd
import com.hvsna.app.data.RecurringType
import com.hvsna.app.data.Tag
import com.hvsna.app.data.Task
import com.hvsna.app.data.isPrayerAnchored
import com.hvsna.app.data.nextPrayerTime
import com.hvsna.app.data.reminderOffsetPresets
import compose.icons.TablerIcons
import compose.icons.tablericons.ArrowLeft
import compose.icons.tablericons.Repeat
import compose.icons.tablericons.X
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.util.Calendar
import java.util.Locale

private val dateFormat = SimpleDateFormat("MMM d, yyyy", Locale.getDefault())
private val timeFormat = SimpleDateFormat("h:mm a", Locale.getDefault())

@Composable
private fun UnderlineTextField(
    value: String,
    onValueChange: (String) -> Unit,
    placeholder: String,
    modifier: Modifier = Modifier,
    singleLine: Boolean = false,
    minLines: Int = 1,
) {
    val interactionSource = remember { MutableInteractionSource() }
    val textColor = MaterialTheme.colorScheme.onSurface
    BasicTextField(
        value = value,
        onValueChange = onValueChange,
        modifier = modifier,
        textStyle = LocalTextStyle.current.copy(color = textColor),
        singleLine = singleLine,
        minLines = minLines,
        cursorBrush = SolidColor(MaterialTheme.colorScheme.primary),
        interactionSource = interactionSource,
        decorationBox = { innerTextField ->
            OutlinedTextFieldDefaults.DecorationBox(
                value = value,
                innerTextField = innerTextField,
                enabled = true,
                singleLine = singleLine,
                visualTransformation = VisualTransformation.None,
                interactionSource = interactionSource,
                placeholder = { Text(placeholder) },
                contentPadding = PaddingValues(0.dp),
                container = {},
            )
        },
    )
}

private class PrayerButtonSpec(
    val selected: Boolean,
    val onClick: () -> Unit,
    val content: @Composable RowScope.() -> Unit,
)

@Composable
private fun SelectableOutlinedButton(
    selected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    content: @Composable RowScope.() -> Unit,
) {
    OutlinedButton(
        onClick = onClick,
        modifier = modifier,
        colors = if (selected) {
            ButtonDefaults.outlinedButtonColors(
                containerColor = MaterialTheme.colorScheme.primaryContainer,
                contentColor = MaterialTheme.colorScheme.onPrimaryContainer,
            )
        } else {
            ButtonDefaults.outlinedButtonColors()
        },
        border = BorderStroke(
            width = if (selected) 1.5.dp else 1.dp,
            color = if (selected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outline,
        ),
        content = content,
    )
}

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
fun TaskBottomSheet(
    task: Task?,
    sheetState: SheetState,
    onDismiss: () -> Unit,
    onSave: (Task, List<String>, RecurrenceInput) -> Unit,
    onDelete: ((Task) -> Unit)? = null,
    hasLocation: Boolean = false,
    getPrayerTimes: (year: Int, month: Int, day: Int) -> List<Pair<String, Long>> = { _, _, _ -> emptyList() },
    onOpenSettings: () -> Unit = {},
    hijriMonthOffsets: Map<Int, Int> = emptyMap(),
    allTags: List<Tag> = emptyList(),
    initialTagIds: Set<String> = emptySet(),
    onCreateTag: suspend (String) -> Tag = { Tag(name = it, color = 0L) },
    defaultScheduledTime: Long? = null,
    recurrenceRule: RecurrenceRule? = null,
    remindersGloballyEnabled: Boolean = false,
) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()

    var title by remember(task) { mutableStateOf(task?.title ?: "") }
    var description by remember(task) { mutableStateOf(task?.description ?: "") }
    var scheduledTime by remember(task) {
        mutableStateOf<Long?>(if (task != null) task.scheduledTime else defaultScheduledTime)
    }
    var repeatEnabled by remember(task, recurrenceRule) { mutableStateOf(recurrenceRule != null) }
    var repeatIntervalCount by remember(task, recurrenceRule) { mutableStateOf(recurrenceRule?.recurringInterval ?: 1) }
    var repeatType by remember(task, recurrenceRule) {
        mutableStateOf(recurrenceRule?.recurringType ?: RecurringType.DAILY)
    }
    var selectedPrayerName by remember(task) { mutableStateOf(task?.atTime?.takeIf { isPrayerAnchored(it) }) }
    var isAllDay by remember(task) {
        mutableStateOf(
            if (task != null) task.scheduledTime != null && task.atTime == null
            else defaultScheduledTime != null
        )
    }
    var reminderEnabled by remember(task) { mutableStateOf(task?.reminderEnabled ?: false) }
    var reminderOffsetMinutes by remember(task) { mutableStateOf(task?.reminderOffsetMinutes ?: 0) }
    var selectedTagIds by remember(task) { mutableStateOf(initialTagIds) }
    var tagQuery by remember(task) { mutableStateOf("") }
    var tagMenuExpanded by remember(task) { mutableStateOf(false) }
    var tagRowSize by remember(task) { mutableStateOf(IntSize.Zero) }
    var showPrayerPicker by remember { mutableStateOf(false) }
    var showDatePicker by remember { mutableStateOf(false) }
    val titleFocusRequester = remember { FocusRequester() }

    LaunchedEffect(Unit) {
        titleFocusRequester.requestFocus()
    }

    fun calFromTime() = Calendar.getInstance().apply { timeInMillis = scheduledTime ?: System.currentTimeMillis() }

    fun applySelectedDate(date: LocalDate) {
        val year = date.year
        val month = date.monthValue - 1
        val day = date.dayOfMonth
        when {
            selectedPrayerName != null -> {
                val prayers = getPrayerTimes(year, month + 1, day)
                if (prayers.isNotEmpty()) {
                    val refMs = Calendar.getInstance().apply {
                        set(year, month, day, 0, 0, 0)
                        set(Calendar.MILLISECOND, 0)
                    }.timeInMillis
                    scheduledTime = nextPrayerTime(selectedPrayerName!!, prayers, refMs)
                }
            }
            isAllDay || scheduledTime == null -> {
                scheduledTime = Calendar.getInstance().apply {
                    set(year, month, day, 23, 59, 59)
                    set(Calendar.MILLISECOND, 999)
                }.timeInMillis
                isAllDay = true
            }
            else -> {
                val current = calFromTime()
                scheduledTime = Calendar.getInstance().apply {
                    set(year, month, day, current.get(Calendar.HOUR_OF_DAY), current.get(Calendar.MINUTE), 0)
                    set(Calendar.MILLISECOND, 0)
                }.timeInMillis
            }
        }
        showDatePicker = false
    }

    fun showCustomTimePicker() {
        val cal = calFromTime()
        TimePickerDialog(
            context,
            { _, hour, minute ->
                val current = calFromTime()
                scheduledTime = Calendar.getInstance().apply {
                    set(
                        current.get(Calendar.YEAR),
                        current.get(Calendar.MONTH),
                        current.get(Calendar.DAY_OF_MONTH),
                        hour, minute, 0,
                    )
                    set(Calendar.MILLISECOND, 0)
                }.timeInMillis
                selectedPrayerName = null
                isAllDay = false
            },
            cal.get(Calendar.HOUR_OF_DAY),
            cal.get(Calendar.MINUTE),
            false,
        ).show()
    }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp)
                .imePadding(),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            if (showDatePicker) {
                val initialDate = remember(scheduledTime) {
                    Instant.ofEpochMilli(scheduledTime ?: System.currentTimeMillis())
                        .atZone(ZoneId.systemDefault())
                        .toLocalDate()
                }

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    IconButton(onClick = { showDatePicker = false }) {
                        Icon(TablerIcons.ArrowLeft, contentDescription = "Back")
                    }
                    Text("Select date", style = MaterialTheme.typography.titleLarge)
                }

                HijriDatePicker(
                    initialDate = initialDate,
                    hijriMonthOffsets = hijriMonthOffsets,
                    onDateSelected = { date -> applySelectedDate(date) },
                    modifier = Modifier.fillMaxWidth(),
                )

                // bottom padding
                Text("", modifier = Modifier.padding(bottom = 4.dp))
            } else if (showPrayerPicker) {
                val cal = calFromTime()
                val year = cal.get(Calendar.YEAR)
                val month = cal.get(Calendar.MONTH) + 1
                val day = cal.get(Calendar.DAY_OF_MONTH)
                val prayerTimes = remember(scheduledTime, hasLocation) {
                    getPrayerTimes(year, month, day)
                }

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    IconButton(onClick = { showPrayerPicker = false }) {
                        Icon(TablerIcons.ArrowLeft, contentDescription = "Back")
                    }
                    Text("Select time", style = MaterialTheme.typography.titleLarge)
                }

                if (!hasLocation) {
                    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Text(
                            "Prayer times require a location.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                        TextButton(onClick = {
                            showPrayerPicker = false
                            onDismiss()
                            onOpenSettings()
                        }) {
                            Text("Set location in Settings")
                        }
                    }
                } else {
                    val isCustomTime = selectedPrayerName == null && !isAllDay
                    val gridButtons = buildList {
                        prayerTimes.forEach { (name, epochMs) ->
                            add(
                                PrayerButtonSpec(
                                    selected = selectedPrayerName == name,
                                    onClick = {
                                        scheduledTime = nextPrayerTime(name, prayerTimes, epochMs)
                                        selectedPrayerName = name
                                        isAllDay = false
                                        showPrayerPicker = false
                                    },
                                ) {
                                    Text(name, modifier = Modifier.weight(1f), textAlign = TextAlign.Start)
                                    Text(timeFormat.format(epochMs), style = MaterialTheme.typography.labelMedium)
                                },
                            )
                        }
                        add(
                            PrayerButtonSpec(
                                selected = isCustomTime,
                                onClick = {
                                    showPrayerPicker = false
                                    showCustomTimePicker()
                                },
                            ) {
                                Text("Custom time…", modifier = Modifier.weight(1f))
                                if (isCustomTime && scheduledTime != null) {
                                    Text(timeFormat.format(scheduledTime!!), style = MaterialTheme.typography.labelMedium)
                                }
                            },
                        )
                    }

                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        gridButtons.chunked(2).forEach { rowItems ->
                            Row(
                                horizontalArrangement = Arrangement.spacedBy(8.dp),
                                modifier = Modifier.fillMaxWidth(),
                            ) {
                                rowItems.forEach { spec ->
                                    SelectableOutlinedButton(
                                        selected = spec.selected,
                                        onClick = spec.onClick,
                                        modifier = Modifier.weight(1f),
                                        content = spec.content,
                                    )
                                }
                            }
                        }
                    }
                }

                SelectableOutlinedButton(
                    selected = isAllDay,
                    onClick = {
                        val current = calFromTime()
                        scheduledTime = Calendar.getInstance().apply {
                            set(
                                current.get(Calendar.YEAR),
                                current.get(Calendar.MONTH),
                                current.get(Calendar.DAY_OF_MONTH),
                                23, 59, 59,
                            )
                            set(Calendar.MILLISECOND, 999)
                        }.timeInMillis
                        selectedPrayerName = null
                        isAllDay = true
                        showPrayerPicker = false
                    },
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Text("All day", modifier = Modifier.weight(1f))
                }

                // bottom padding
                Text("", modifier = Modifier.padding(bottom = 4.dp))
            } else {

                UnderlineTextField(
                    value = title,
                    onValueChange = { title = it },
                    placeholder = "Title",
                    singleLine = true,
                    modifier = Modifier
                        .fillMaxWidth()
                        .focusRequester(titleFocusRequester),
                )

                UnderlineTextField(
                    value = description,
                    onValueChange = { description = it },
                    placeholder = "Description",
                    minLines = 2,
                    modifier = Modifier.fillMaxWidth(),
                )

                Box(modifier = Modifier.fillMaxWidth()) {
                    FlowRow(
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .onSizeChanged { tagRowSize = it },
                    ) {
                        allTags.filter { it.id in selectedTagIds }.forEach { tag ->
                            FilterChip(
                                selected = true,
                                onClick = {},
                                label = { Text("#" + tag.name, color = Color(tag.color.toInt())) },
                                trailingIcon = {
                                    Icon(
                                        imageVector = TablerIcons.X,
                                        contentDescription = "Remove ${tag.name}",
                                        modifier = Modifier
                                            .size(FilterChipDefaults.IconSize)
                                            .clickable { selectedTagIds = selectedTagIds - tag.id },
                                    )
                                },
                                modifier = Modifier.align(Alignment.CenterVertically),
                            )
                        }

                        UnderlineTextField(
                            value = tagQuery,
                            onValueChange = {
                                tagQuery = it
                                tagMenuExpanded = it.isNotBlank()
                            },
                            placeholder = "Add tags",
                            singleLine = true,
                            modifier = Modifier
                                .weight(1f)
                                .align(Alignment.CenterVertically),
                        )
                    }

                    val query = tagQuery.trim()
                    val matchingTags = allTags
                        .filter { it.id !in selectedTagIds }
                        .filter { it.name.contains(query, ignoreCase = true) }
                        .take(3)
                    val hasExactMatch = allTags.any { it.name.equals(query, ignoreCase = true) }

                    if (tagMenuExpanded && query.isNotEmpty() && (matchingTags.isNotEmpty() || !hasExactMatch)) {
                        val density = LocalDensity.current
                        Popup(
                            alignment = Alignment.TopStart,
                            offset = IntOffset(0, tagRowSize.height),
                            onDismissRequest = { tagMenuExpanded = false },
                            properties = PopupProperties(focusable = false),
                        ) {
                            Surface(
                                modifier = Modifier.width(with(density) { tagRowSize.width.toDp() }),
                                shape = MaterialTheme.shapes.extraSmall,
                                color = MaterialTheme.colorScheme.surfaceContainer,
                                shadowElevation = 3.dp,
                            ) {
                                Column {
                                    matchingTags.forEach { tag ->
                                        ListItem(
                                            headlineContent = { Text(tag.name) },
                                            modifier = Modifier.clickable {
                                                selectedTagIds = selectedTagIds + tag.id
                                                tagQuery = ""
                                                tagMenuExpanded = false
                                            },
                                        )
                                    }
                                    if (!hasExactMatch) {
                                        ListItem(
                                            headlineContent = { Text("Create '$query'") },
                                            modifier = Modifier.clickable {
                                                coroutineScope.launch {
                                                    val tag = onCreateTag(query)
                                                    selectedTagIds = selectedTagIds + tag.id
                                                }
                                                tagQuery = ""
                                                tagMenuExpanded = false
                                            },
                                        )
                                    }
                                }
                            }
                        }
                    }
                }

                if (scheduledTime == null) {
                    OutlinedButton(
                        onClick = { showDatePicker = true },
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Text("No date")
                    }
                } else {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        OutlinedButton(
                            onClick = { showDatePicker = true },
                            modifier = Modifier.weight(1f),
                        ) {
                            Text(dateFormat.format(scheduledTime))
                        }
                        OutlinedButton(
                            onClick = { showPrayerPicker = true },
                            modifier = Modifier.weight(1f),
                        ) {
                            Text(
                                selectedPrayerName
                                    ?: if (isAllDay) "All day"
                                    else timeFormat.format(scheduledTime!!)
                            )
                        }
                    }
                    TextButton(
                        onClick = { scheduledTime = null; selectedPrayerName = null; isAllDay = false },
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Text("Remove date")
                    }

                    if (remindersGloballyEnabled && !isAllDay && selectedPrayerName == null) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.fillMaxWidth(),
                        ) {
                            Text(
                                "Reminder",
                                style = MaterialTheme.typography.bodyLarge,
                                modifier = Modifier.weight(1f),
                            )
                            Switch(checked = reminderEnabled, onCheckedChange = { reminderEnabled = it })
                        }

                        if (reminderEnabled) {
                            FlowRow(
                                horizontalArrangement = Arrangement.spacedBy(8.dp),
                                verticalArrangement = Arrangement.spacedBy(8.dp),
                                modifier = Modifier.fillMaxWidth(),
                            ) {
                                reminderOffsetPresets.forEach { preset ->
                                    FilterChip(
                                        selected = reminderOffsetMinutes == preset.minutes,
                                        onClick = { reminderOffsetMinutes = preset.minutes },
                                        label = { Text(preset.label) },
                                    )
                                }
                            }
                        }
                    }

                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Icon(TablerIcons.Repeat, contentDescription = null)
                        Text(
                            "Repeat",
                            style = MaterialTheme.typography.bodyLarge,
                            modifier = Modifier
                                .weight(1f)
                                .padding(start = 12.dp),
                        )
                        Switch(checked = repeatEnabled, onCheckedChange = { repeatEnabled = it })
                    }

                    if (repeatEnabled) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(4.dp),
                        ) {
                            Text("Every", style = MaterialTheme.typography.bodyMedium)
                            IconButton(onClick = { repeatIntervalCount = (repeatIntervalCount - 1).coerceAtLeast(1) }) {
                                Text("−", style = MaterialTheme.typography.titleLarge)
                            }
                            Text(repeatIntervalCount.toString(), style = MaterialTheme.typography.bodyLarge)
                            IconButton(onClick = { repeatIntervalCount += 1 }) {
                                Text("+", style = MaterialTheme.typography.titleLarge)
                            }
                        }
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            modifier = Modifier.fillMaxWidth(),
                        ) {
                            val unitLabels = listOf(
                                RecurringType.DAILY to "Day",
                                RecurringType.WEEKLY to "Week",
                                RecurringType.MONTHLY to "Month",
                                RecurringType.YEARLY to "Year",
                            )
                            unitLabels.forEach { (type, noun) ->
                                FilterChip(
                                    selected = repeatType == type,
                                    onClick = { repeatType = type },
                                    label = { Text(noun + if (repeatIntervalCount != 1) "s" else "") },
                                )
                            }
                        }
                    }
                }

                Button(
                    onClick = {
                        val atTime = when {
                            selectedPrayerName != null -> selectedPrayerName
                            isAllDay || scheduledTime == null -> null
                            else -> {
                                val cal = calFromTime()
                                "%02d:%02d".format(cal.get(Calendar.HOUR_OF_DAY), cal.get(Calendar.MINUTE))
                            }
                        }
                        onSave(
                            Task(
                                id = task?.id ?: java.util.UUID.randomUUID().toString(),
                                title = title.trim(),
                                description = description.trim(),
                                scheduledTime = scheduledTime,
                                isDone = task?.isDone ?: 0,
                                atTime = atTime,
                                recurringTaskId = task?.recurringTaskId,
                                lat = task?.lat,
                                lng = task?.lng,
                                timezone = task?.timezone,
                                hijriDateOffset = task?.hijriDateOffset,
                                reminderEnabled = reminderEnabled && !isAllDay && selectedPrayerName == null,
                                reminderOffsetMinutes = reminderOffsetMinutes,
                            ),
                            selectedTagIds.toList(),
                            if (scheduledTime != null && repeatEnabled) {
                                RecurrenceInput(enabled = true, recurringType = repeatType, recurringInterval = repeatIntervalCount, recurringEnd = RecurringEnd.NEVER)
                            } else {
                                RecurrenceInput.None
                            },
                        )
                        onDismiss()
                    },
                    enabled = title.isNotBlank(),
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = if (task != null) 0.dp else 16.dp),
                ) {
                    Text("Save")
                }

                if (task != null && onDelete != null) {
                    OutlinedButton(
                        onClick = {
                            onDelete(task)
                            onDismiss()
                        },
                        colors = ButtonDefaults.outlinedButtonColors(
                            contentColor = MaterialTheme.colorScheme.error,
                        ),
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 16.dp),
                    ) {
                        Text("Delete")
                    }
                }
            }
        }
    }
}
