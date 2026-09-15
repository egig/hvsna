package com.hvsna.app.ui.components

import android.app.TimePickerDialog
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
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
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
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
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.OffsetMapping
import androidx.compose.ui.text.input.TextFieldValue
import androidx.compose.ui.text.input.TransformedText
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
import com.hvsna.app.data.combinedDateLabel
import com.hvsna.app.data.isPrayerAnchored
import com.hvsna.app.data.nextPrayerTime
import com.hvsna.app.data.reminderOffsetPresets
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.util.Calendar
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.vectorResource
import com.hvsna.app.R
import com.hvsna.app.i18n.LocalStrings
import com.hvsna.app.ui.TitleTagFieldState
import com.hvsna.app.ui.theme.accessibleColor

@Composable
private fun UnderlineTextField(
    value: String,
    onValueChange: (String) -> Unit,
    placeholder: String,
    modifier: Modifier = Modifier,
    singleLine: Boolean = false,
    minLines: Int = 1,
    focusRequester: FocusRequester? = null,
) {
    val interactionSource = remember { MutableInteractionSource() }
    val textColor = MaterialTheme.colorScheme.onSurface
    BasicTextField(
        value = value,
        onValueChange = onValueChange,
        modifier = modifier.then(if (focusRequester != null) Modifier.focusRequester(focusRequester) else Modifier),
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

/**
 * Task title field that doubles as a fast tag-entry path. Typing `#name` opens an autosuggest
 * popup; picking a suggestion commits a colored inline token (see [TitleTagFieldState]). All the
 * text/token/tag reconciliation lives in the pure [TitleTagFieldState]; this composable is just
 * the `BasicTextField` + popup shell.
 */
@Composable
private fun TitleTagInput(
    state: TitleTagFieldState,
    onStateChange: (TitleTagFieldState) -> Unit,
    allTags: List<Tag>,
    onCreateTag: suspend (String) -> Tag,
    placeholder: String,
    modifier: Modifier = Modifier,
    focusRequester: FocusRequester? = null,
    onSubmit: () -> Unit = {},
) {
    val scope = rememberCoroutineScope()
    val strings = LocalStrings.current
    val interactionSource = remember { MutableInteractionSource() }
    val textColor = MaterialTheme.colorScheme.onSurface
    val latestState by rememberUpdatedState(state)
    var fieldSize by remember { mutableStateOf(IntSize.Zero) }
    var focused by remember { mutableStateOf(false) }

    val tokenColors = allTags.associate { it.id to it.accessibleColor() }
    val transformation = VisualTransformation { annotated ->
        val builder = AnnotatedString.Builder(annotated.text)
        state.tokens.forEach { tok ->
            val color = tokenColors[tok.tagId]
            if (color != null && tok.end <= annotated.text.length) {
                builder.addStyle(SpanStyle(color = color, fontWeight = FontWeight.Medium), tok.start, tok.end)
            }
        }
        TransformedText(builder.toAnnotatedString(), OffsetMapping.Identity)
    }

    val value = TextFieldValue(
        text = state.text,
        selection = androidx.compose.ui.text.TextRange(state.selectionStart, state.selectionEnd),
    )

    Box(modifier = modifier) {
        BasicTextField(
            value = value,
            onValueChange = { v ->
                onStateChange(latestState.onTextChanged(v.text, v.selection.start, v.selection.end))
            },
            modifier = Modifier
                .fillMaxWidth()
                .onSizeChanged { fieldSize = it }
                .onFocusChanged { focused = it.isFocused }
                .then(if (focusRequester != null) Modifier.focusRequester(focusRequester) else Modifier),
            textStyle = LocalTextStyle.current.copy(color = textColor),
            singleLine = false,
            keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done),
            keyboardActions = KeyboardActions(onDone = { onSubmit() }),
            cursorBrush = SolidColor(MaterialTheme.colorScheme.primary),
            interactionSource = interactionSource,
            visualTransformation = transformation,
            decorationBox = { innerTextField ->
                OutlinedTextFieldDefaults.DecorationBox(
                    value = state.text,
                    innerTextField = innerTextField,
                    enabled = true,
                    singleLine = false,
                    visualTransformation = VisualTransformation.None,
                    interactionSource = interactionSource,
                    placeholder = { Text(placeholder) },
                    contentPadding = PaddingValues(0.dp),
                    container = {},
                )
            },
        )

        val active = state.activeQuery()
        val query = active?.query?.trim().orEmpty()
        val committedIds = state.effectiveTagIds.toSet()
        val matching = allTags
            .filter { it.id !in committedIds && it.name.contains(query, ignoreCase = true) }
            .take(3)
        val hasExactMatch = allTags.any { it.name.equals(query, ignoreCase = true) }

        if (focused && active != null && query.isNotEmpty() && (matching.isNotEmpty() || !hasExactMatch)) {
            val density = LocalDensity.current
            Popup(
                alignment = Alignment.TopStart,
                offset = IntOffset(0, fieldSize.height),
                onDismissRequest = { },
                properties = PopupProperties(focusable = false),
            ) {
                Surface(
                    modifier = Modifier.width(with(density) { fieldSize.width.toDp() }),
                    shape = MaterialTheme.shapes.extraSmall,
                    color = MaterialTheme.colorScheme.surfaceContainer,
                    shadowElevation = 3.dp,
                ) {
                    Column {
                        matching.forEach { tag ->
                            ListItem(
                                headlineContent = { Text("#${tag.name}") },
                                modifier = Modifier.clickable {
                                    onStateChange(latestState.commitSuggestion(tag.id, tag.name))
                                },
                            )
                        }
                        if (!hasExactMatch) {
                            ListItem(
                                headlineContent = { Text(strings.format("task.createTag", query)) },
                                modifier = Modifier.clickable {
                                    scope.launch {
                                        val tag = onCreateTag(query)
                                        val cur = latestState
                                        val stillActive = cur.activeQuery()
                                        onStateChange(
                                            if (stillActive != null &&
                                                stillActive.query.trim().equals(query, ignoreCase = true)
                                            ) {
                                                cur.commitSuggestion(tag.id, tag.name)
                                            } else {
                                                cur.addPickerTag(tag.id)
                                            }
                                        )
                                    }
                                },
                            )
                        }
                    }
                }
            }
        }
    }
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
    val strings = LocalStrings.current
    val timeFormat = remember(strings.locale) { SimpleDateFormat("h:mm a", strings.locale) }

    var titleTagState by remember(task) {
        mutableStateOf(TitleTagFieldState.initial(task?.title ?: "", initialTagIds.toList()))
    }
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
            if (task != null) task.scheduledTime != null && task.atTime.isNullOrBlank()
            else defaultScheduledTime != null
        )
    }
    var reminderEnabled by remember(task) { mutableStateOf(task?.reminderEnabled ?: false) }
    var reminderOffsetMinutes by remember(task) { mutableStateOf(task?.reminderOffsetMinutes ?: 0) }
    var tagPickerQuery by remember(task) { mutableStateOf("") }
    var showPrayerPicker by remember { mutableStateOf(false) }
    var showDatePicker by remember { mutableStateOf(false) }
    var showTagPicker by remember { mutableStateOf(false) }
    val titleFocusRequester = remember { FocusRequester() }
    val descriptionFocusRequester = remember { FocusRequester() }

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
                        Icon(ImageVector.vectorResource(id = R.drawable.ic_arrow_left), contentDescription = strings["common.back"])
                    }
                    Text(strings["task.selectDate"], style = MaterialTheme.typography.titleLarge)
                }

                HijriDatePicker(
                    initialDate = initialDate,
                    hijriMonthOffsets = hijriMonthOffsets,
                    onDateSelected = { date -> applySelectedDate(date) },
                    modifier = Modifier.fillMaxWidth(),
                    locale = strings.locale,
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
                        Icon(ImageVector.vectorResource(id = R.drawable.ic_arrow_left), contentDescription = strings["common.back"])
                    }
                    Text(strings["task.selectTime"], style = MaterialTheme.typography.titleLarge)
                }

                if (!hasLocation) {
                    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Text(
                            strings["task.prayerTimesRequireLocation"],
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                        TextButton(onClick = {
                            showPrayerPicker = false
                            onDismiss()
                            onOpenSettings()
                        }) {
                            Text(strings["task.setLocationInSettings"])
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
                                    Text(strings["prayer.$name"], modifier = Modifier.weight(1f), textAlign = TextAlign.Start)
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
                                Text(strings["task.customTime"], modifier = Modifier.weight(1f))
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
                    Text(strings["task.allDay"], modifier = Modifier.weight(1f))
                }

                // bottom padding
                Text("", modifier = Modifier.padding(bottom = 4.dp))
            } else if (showTagPicker) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    IconButton(onClick = { showTagPicker = false }) {
                        Icon(ImageVector.vectorResource(id = R.drawable.ic_arrow_left), contentDescription = strings["common.back"])
                    }
                    Text(strings["task.selectTags"], style = MaterialTheme.typography.titleLarge)
                }

                UnderlineTextField(
                    value = tagPickerQuery,
                    onValueChange = { tagPickerQuery = it },
                    placeholder = strings["task.addTags"],
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                )

                val pickerQuery = tagPickerQuery.trim()
                val selectedIds = titleTagState.effectiveTagIds.toSet()
                val pickerHasExact = allTags.any { it.name.equals(pickerQuery, ignoreCase = true) }
                val sortedTags = allTags
                    .filter { it.name.contains(pickerQuery, ignoreCase = true) }
                    .sortedWith(
                        compareByDescending<Tag> { it.id in selectedIds }
                            .thenBy { it.name.lowercase(strings.locale) },
                    )

                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(max = 360.dp)
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(6.dp),
                ) {
                    sortedTags.forEach { tag ->
                        val selected = tag.id in selectedIds
                        val tagColor = tag.accessibleColor()
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(8.dp))
                                .background(tagColor.copy(alpha = if (selected) 0.22f else 0.10f))
                                .clickable {
                                    titleTagState = if (selected) {
                                        titleTagState.removeTag(tag.id)
                                    } else {
                                        titleTagState.addPickerTag(tag.id)
                                    }
                                }
                                .padding(horizontal = 14.dp, vertical = 12.dp),
                        ) {
                            Text(
                                "#${tag.name}",
                                color = tagColor,
                                style = MaterialTheme.typography.bodyMedium,
                                modifier = Modifier.weight(1f),
                            )
                            if (selected) {
                                Icon(
                                    imageVector = ImageVector.vectorResource(id = R.drawable.ic_check),
                                    contentDescription = null,
                                    tint = tagColor,
                                    modifier = Modifier.size(18.dp),
                                )
                            }
                        }
                    }
                    if (pickerQuery.isNotEmpty() && !pickerHasExact) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(8.dp))
                                .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.10f))
                                .clickable {
                                    coroutineScope.launch {
                                        val tag = onCreateTag(pickerQuery)
                                        titleTagState = titleTagState.addPickerTag(tag.id)
                                    }
                                    tagPickerQuery = ""
                                }
                                .padding(horizontal = 14.dp, vertical = 12.dp),
                        ) {
                            Text(
                                strings.format("task.createTag", pickerQuery),
                                color = MaterialTheme.colorScheme.primary,
                                style = MaterialTheme.typography.bodyMedium,
                            )
                        }
                    }
                }

                // bottom padding
                Text("", modifier = Modifier.padding(bottom = 4.dp))
            } else {

                TitleTagInput(
                    state = titleTagState,
                    onStateChange = { titleTagState = it },
                    allTags = allTags,
                    onCreateTag = onCreateTag,
                    placeholder = strings["task.titlePlaceholder"],
                    modifier = Modifier.fillMaxWidth(),
                    focusRequester = titleFocusRequester,
                    onSubmit = { descriptionFocusRequester.requestFocus() },
                )

                UnderlineTextField(
                    value = description,
                    onValueChange = { description = it },
                    placeholder = strings["task.descriptionPlaceholder"],
                    minLines = 2,
                    modifier = Modifier.fillMaxWidth(),
                    focusRequester = descriptionFocusRequester,
                )

                FlowRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    if (scheduledTime == null) {
                        OutlinedButton(onClick = { showDatePicker = true }) {
                            Text(strings["task.noDate"])
                        }
                    } else {
                        OutlinedButton(onClick = { showDatePicker = true }) {
                            Text(combinedDateLabel(scheduledTime!!, hijriMonthOffsets, strings = strings, includeYear = false))
                        }
                        OutlinedButton(onClick = { showPrayerPicker = true }) {
                            Text(
                                selectedPrayerName?.let { strings["prayer.$it"] }
                                    ?: if (isAllDay) strings["task.allDay"]
                                    else timeFormat.format(scheduledTime!!)
                            )
                        }
                    }
                    OutlinedButton(onClick = { showTagPicker = true }) {
                        val tagCount = titleTagState.effectiveTagIds.size
                        Text(
                            if (tagCount == 0) strings["task.tags"]
                            else strings.format(
                                if (tagCount == 1) "task.tagCount.one" else "task.tagCount.other",
                                tagCount,
                            )
                        )
                    }
                }

                if (scheduledTime != null) {
                    TextButton(
                        onClick = { scheduledTime = null; selectedPrayerName = null; isAllDay = false },
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Text(strings["task.removeDate"])
                    }

                    if (remindersGloballyEnabled && !isAllDay && selectedPrayerName == null) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.fillMaxWidth(),
                        ) {
                            Text(
                                strings["task.reminder"],
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
                                        label = { Text(strings[preset.labelKey]) },
                                    )
                                }
                            }
                        }
                    }

                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Icon(ImageVector.vectorResource(id = R.drawable.ic_repeat), contentDescription = null)
                        Text(
                            strings["task.repeat"],
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
                            Text(strings["task.every"], style = MaterialTheme.typography.bodyMedium)
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
                            val plural = repeatIntervalCount != 1
                            val unitLabels = listOf(
                                RecurringType.DAILY to if (plural) "unit.days" else "unit.day",
                                RecurringType.WEEKLY to if (plural) "unit.weeks" else "unit.week",
                                RecurringType.MONTHLY to if (plural) "unit.months" else "unit.month",
                                RecurringType.YEARLY to if (plural) "unit.years" else "unit.year",
                            )
                            unitLabels.forEach { (type, unitKey) ->
                                FilterChip(
                                    selected = repeatType == type,
                                    onClick = { repeatType = type },
                                    label = { Text(strings[unitKey]) },
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
                                title = titleTagState.strippedTitle,
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
                            titleTagState.effectiveTagIds,
                            if (scheduledTime != null && repeatEnabled) {
                                RecurrenceInput(enabled = true, recurringType = repeatType, recurringInterval = repeatIntervalCount, recurringEnd = RecurringEnd.NEVER)
                            } else {
                                RecurrenceInput.None
                            },
                        )
                        onDismiss()
                    },
                    enabled = titleTagState.hasTitle,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = if (task != null) 0.dp else 16.dp),
                ) {
                    Text(strings["task.save"])
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
                        Text(strings["task.delete"])
                    }
                }
            }
        }
    }
}
