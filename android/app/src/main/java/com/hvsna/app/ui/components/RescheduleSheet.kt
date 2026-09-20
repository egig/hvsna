package com.hvsna.app.ui.components

import android.app.TimePickerDialog
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.SheetState
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.vectorResource
import androidx.compose.ui.unit.dp
import com.hvsna.app.R
import com.hvsna.app.data.Task
import com.hvsna.app.i18n.LocalStrings
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.util.Calendar

/**
 * Minimal quick-reschedule surface opened from [TaskListItem]'s swipe-left action — a couple of
 * relative-date shortcuts plus a full date/time picker, as opposed to [TaskBottomSheet] which
 * opens the whole task editor. Keeps [task]'s current time-of-day for the relative shortcuts when
 * it has one, defaulting to 09:00 for a task that was previously unscheduled.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RescheduleSheet(
    task: Task,
    sheetState: SheetState,
    onDismiss: () -> Unit,
    onReschedule: (Long) -> Unit,
    hijriMonthOffsets: Map<Int, Int> = emptyMap(),
    modifier: Modifier = Modifier,
) {
    val strings = LocalStrings.current
    val context = LocalContext.current
    var showDatePicker by remember(task) { mutableStateOf(false) }

    fun confirm(timestamp: Long) {
        onReschedule(timestamp)
        onDismiss()
    }

    fun shiftedByDays(days: Int): Long {
        val timeOfDay = task.scheduledTime?.let { Calendar.getInstance().apply { timeInMillis = it } }
        return Calendar.getInstance().apply {
            add(Calendar.DAY_OF_YEAR, days)
            if (timeOfDay != null) {
                set(Calendar.HOUR_OF_DAY, timeOfDay.get(Calendar.HOUR_OF_DAY))
                set(Calendar.MINUTE, timeOfDay.get(Calendar.MINUTE))
            } else {
                set(Calendar.HOUR_OF_DAY, 9)
                set(Calendar.MINUTE, 0)
            }
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }.timeInMillis
    }

    fun laterToday(): Long = Calendar.getInstance().apply {
        add(Calendar.HOUR_OF_DAY, 3)
        set(Calendar.SECOND, 0)
        set(Calendar.MILLISECOND, 0)
    }.timeInMillis

    fun showTimePickerFor(date: LocalDate) {
        val initial = Calendar.getInstance()
        TimePickerDialog(
            context,
            { _, hour, minute ->
                val result = Calendar.getInstance().apply {
                    set(date.year, date.monthValue - 1, date.dayOfMonth, hour, minute, 0)
                    set(Calendar.MILLISECOND, 0)
                }.timeInMillis
                confirm(result)
            },
            initial.get(Calendar.HOUR_OF_DAY),
            initial.get(Calendar.MINUTE),
            false,
        ).show()
    }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        modifier = modifier,
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp)
                .imePadding(),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            if (showDatePicker) {
                val initialDate = remember(task) {
                    Instant.ofEpochMilli(task.scheduledTime ?: System.currentTimeMillis())
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
                    onDateSelected = { date ->
                        showDatePicker = false
                        showTimePickerFor(date)
                    },
                    modifier = Modifier.fillMaxWidth(),
                    locale = strings.locale,
                )

                // bottom padding
                Text("", modifier = Modifier.padding(bottom = 4.dp))
            } else {
                Text(strings["reschedule.title"], style = MaterialTheme.typography.titleLarge)

                Button(
                    onClick = { confirm(laterToday()) },
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Text(strings["reschedule.laterToday"])
                }
                OutlinedButton(
                    onClick = { confirm(shiftedByDays(1)) },
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Text(strings["reschedule.tomorrow"])
                }
                OutlinedButton(
                    onClick = { confirm(shiftedByDays(7)) },
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Text(strings["reschedule.nextWeek"])
                }
                OutlinedButton(
                    onClick = { showDatePicker = true },
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 16.dp),
                ) {
                    Text(strings["reschedule.pickDateTime"])
                }
            }
        }
    }
}
