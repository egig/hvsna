package com.hvsna.app.ui.screens

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LargeTopAppBar
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.ListItem
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.compose.ui.res.vectorResource
import androidx.compose.ui.unit.dp
import com.hvsna.app.R
import com.hvsna.app.data.MadeUpDateCheck
import com.hvsna.app.data.QadhaFast
import com.hvsna.app.data.QadhaReason
import com.hvsna.app.data.combinedDateLabel
import com.hvsna.app.i18n.LocalStrings
import com.hvsna.app.i18n.Strings
import com.hvsna.app.ui.QadhaUiState
import com.hvsna.app.ui.QadhaViewModel
import com.hvsna.app.ui.components.HijriDatePicker
import kotlinx.coroutines.launch
import java.time.LocalDate

/** How many Ramadan years back the "Add owed days" dialog lets the user go. */
private const val MAX_YEARS_BACK = 30

private fun checkMessageKey(check: MadeUpDateCheck): String? = when (check) {
    MadeUpDateCheck.OK -> "qadha.logged"
    MadeUpDateCheck.FORBIDDEN_EID -> "qadha.errorEid"
    MadeUpDateCheck.FORBIDDEN_RAMADAN -> "qadha.errorRamadan"
    MadeUpDateCheck.FUTURE -> "qadha.errorFuture"
    MadeUpDateCheck.ALREADY_LOGGED -> "qadha.errorAlreadyLogged"
    MadeUpDateCheck.NOTHING_OWED -> "qadha.errorNothingOwed"
    MadeUpDateCheck.WARN_TASHRIQ -> null // answered with a confirmation dialog, not a message
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun QadhaScreen(
    viewModel: QadhaViewModel,
    onBack: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val strings = LocalStrings.current
    val state by viewModel.state.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }
    val scope = rememberCoroutineScope()
    val scrollBehavior = TopAppBarDefaults.exitUntilCollapsedScrollBehavior()

    var showAddDialog by remember { mutableStateOf(false) }
    var showLogSheet by remember { mutableStateOf(false) }
    var pendingTashriqDate by remember { mutableStateOf<LocalDate?>(null) }
    var selectedRow by remember { mutableStateOf<QadhaFast?>(null) }

    fun handleLogResult(date: LocalDate, check: MadeUpDateCheck) {
        if (check == MadeUpDateCheck.WARN_TASHRIQ) {
            pendingTashriqDate = date
            return
        }
        checkMessageKey(check)?.let { key -> scope.launch { snackbarHostState.showSnackbar(strings[key]) } }
    }

    Scaffold(
        modifier = modifier
            .fillMaxSize()
            .nestedScroll(scrollBehavior.nestedScrollConnection),
        snackbarHost = { SnackbarHost(snackbarHostState) },
        topBar = {
            LargeTopAppBar(
                title = { Text(strings["qadha.title"]) },
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
        LazyColumn(modifier = Modifier.fillMaxSize(), contentPadding = innerPadding) {
            item(key = "summary") {
                QadhaSummary(
                    state = state,
                    strings = strings,
                    onLogMadeUp = { showLogSheet = true },
                    onAddOwed = { showAddDialog = true },
                )
            }

            if (state.loaded && state.rows.isEmpty()) {
                item(key = "empty") {
                    Text(
                        strings["qadha.empty"],
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(16.dp),
                    )
                }
            }

            val owed = state.rows.filter { it.madeUpOn == null }
            val madeUp = state.rows.filter { it.madeUpOn != null }
            if (owed.isNotEmpty()) {
                item(key = "owedHeader") { SectionLabel(strings["qadha.owedSection"]) }
                items(owed, key = { it.id }) { row ->
                    QadhaRowItem(row, state.hijriMonthOffsets, strings, onClick = { selectedRow = row })
                }
            }
            if (madeUp.isNotEmpty()) {
                item(key = "madeUpHeader") { SectionLabel(strings["qadha.madeUpSection"]) }
                items(madeUp, key = { it.id }) { row ->
                    QadhaRowItem(row, state.hijriMonthOffsets, strings, onClick = { selectedRow = row })
                }
            }
        }
    }

    if (showLogSheet) {
        val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
        ModalBottomSheet(onDismissRequest = { showLogSheet = false }, sheetState = sheetState) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(start = 16.dp, end = 16.dp, bottom = 16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                Text(strings["qadha.selectDate"], style = MaterialTheme.typography.titleLarge)
                HijriDatePicker(
                    initialDate = LocalDate.now(),
                    hijriMonthOffsets = state.hijriMonthOffsets,
                    onDateSelected = { date ->
                        showLogSheet = false
                        viewModel.logMadeUp(date) { check -> handleLogResult(date, check) }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    locale = strings.locale,
                )
            }
        }
    }

    pendingTashriqDate?.let { date ->
        AlertDialog(
            onDismissRequest = { pendingTashriqDate = null },
            title = { Text(strings["qadha.tashriqTitle"]) },
            text = { Text(strings["qadha.tashriqBody"]) },
            confirmButton = {
                TextButton(onClick = {
                    pendingTashriqDate = null
                    viewModel.logMadeUp(date, confirmedWarning = true) { check -> handleLogResult(date, check) }
                }) { Text(strings["qadha.recordAnyway"]) }
            },
            dismissButton = {
                TextButton(onClick = { pendingTashriqDate = null }) { Text(strings["common.cancel"]) }
            },
        )
    }

    if (showAddDialog && state.latestRamadanYear > 0) {
        AddOwedDialog(
            latestRamadanYear = state.latestRamadanYear,
            strings = strings,
            onDismiss = { showAddDialog = false },
            onConfirm = { count, year, reason ->
                showAddDialog = false
                viewModel.addOwed(count, year, reason)
            },
        )
    }

    selectedRow?.let { row ->
        AlertDialog(
            onDismissRequest = { selectedRow = null },
            title = { Text(rowTitle(row, strings)) },
            text = { Text(rowSubtitle(row, state.hijriMonthOffsets, strings)) },
            confirmButton = {
                if (row.madeUpOn != null) {
                    TextButton(onClick = {
                        selectedRow = null
                        viewModel.markOwedAgain(row)
                    }) { Text(strings["qadha.markOwedAgain"]) }
                } else {
                    TextButton(onClick = { selectedRow = null }) { Text(strings["common.cancel"]) }
                }
            },
            dismissButton = {
                TextButton(onClick = {
                    selectedRow = null
                    viewModel.delete(row)
                }) { Text(strings["common.delete"], color = MaterialTheme.colorScheme.error) }
            },
        )
    }
}

@Composable
private fun QadhaSummary(
    state: QadhaUiState,
    strings: Strings,
    onLogMadeUp: () -> Unit,
    onAddOwed: () -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Row(verticalAlignment = Alignment.Bottom, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(state.totalOwed.toString(), style = MaterialTheme.typography.displayMedium)
            Text(
                strings["qadha.daysOwedLabel"],
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(bottom = 8.dp),
            )
        }

        state.summaries.forEach { summary ->
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text(strings.format("qadha.yearLabel", summary.ramadanHijriYear), style = MaterialTheme.typography.bodyMedium)
                    Text(
                        strings.format("qadha.yearProgress", summary.madeUp, summary.total),
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
                LinearProgressIndicator(
                    progress = { if (summary.total == 0) 0f else summary.madeUp.toFloat() / summary.total },
                    modifier = Modifier.fillMaxWidth(),
                )
            }
        }

        if (state.hasDelayed) {
            Text(
                strings["qadha.fidyahNote"],
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }

        Button(onClick = onLogMadeUp, enabled = state.totalOwed > 0, modifier = Modifier.fillMaxWidth()) {
            Text(strings["qadha.logMadeUp"])
        }
        OutlinedButton(onClick = onAddOwed, enabled = state.latestRamadanYear > 0, modifier = Modifier.fillMaxWidth()) {
            Text(strings["qadha.addOwed"])
        }
    }
    HorizontalDivider(modifier = Modifier.padding(top = 8.dp))
}

@Composable
private fun SectionLabel(text: String) {
    Text(
        text,
        style = MaterialTheme.typography.labelLarge,
        color = MaterialTheme.colorScheme.primary,
        modifier = Modifier.padding(start = 16.dp, top = 16.dp, bottom = 4.dp),
    )
}

private fun rowTitle(row: QadhaFast, strings: Strings): String =
    strings.format("qadha.rowTitle", row.ramadanHijriYear, strings["qadha.reason.${row.reason}"])

private fun rowSubtitle(row: QadhaFast, offsets: Map<Int, Int>, strings: Strings): String {
    fun label(iso: String) = combinedDateLabel(LocalDate.parse(iso), offsets, strings, includeYear = true)
    val missed = row.missedDate?.let { strings.format("qadha.missedOn", label(it)) } ?: strings["qadha.noDate"]
    return row.madeUpOn?.let { "${strings.format("qadha.madeUpOn", label(it))} · $missed" } ?: missed
}

@Composable
private fun QadhaRowItem(row: QadhaFast, offsets: Map<Int, Int>, strings: Strings, onClick: () -> Unit) {
    ListItem(
        headlineContent = { Text(rowTitle(row, strings), style = MaterialTheme.typography.bodyLarge) },
        supportingContent = { Text(rowSubtitle(row, offsets, strings)) },
        leadingContent = {
            Icon(
                ImageVector.vectorResource(id = if (row.madeUpOn != null) R.drawable.ic_circle_check else R.drawable.ic_calendar_event),
                contentDescription = null,
            )
        },
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
    )
}

@Composable
private fun Stepper(label: String, value: String, strings: Strings, onDecrease: (() -> Unit)?, onIncrease: (() -> Unit)?) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        Text(label, style = MaterialTheme.typography.bodyLarge)
        Row(verticalAlignment = Alignment.CenterVertically) {
            IconButton(onClick = { onDecrease?.invoke() }, enabled = onDecrease != null) {
                Icon(ImageVector.vectorResource(id = R.drawable.ic_minus), contentDescription = strings["qadha.decrease"])
            }
            Text(value, style = MaterialTheme.typography.titleMedium)
            IconButton(onClick = { onIncrease?.invoke() }, enabled = onIncrease != null) {
                Icon(ImageVector.vectorResource(id = R.drawable.ic_plus), contentDescription = strings["qadha.increase"])
            }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun AddOwedDialog(
    latestRamadanYear: Int,
    strings: Strings,
    onDismiss: () -> Unit,
    onConfirm: (count: Int, year: Int, reason: String) -> Unit,
) {
    var count by remember { mutableIntStateOf(1) }
    var year by remember { mutableIntStateOf(latestRamadanYear) }
    var reason by remember { mutableStateOf(QadhaReason.HAID) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(strings["qadha.addOwed"]) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Stepper(
                    label = strings["qadha.days"],
                    value = count.toString(),
                    strings = strings,
                    onDecrease = if (count > 1) ({ count -= 1 }) else null,
                    onIncrease = if (count < 30) ({ count += 1 }) else null,
                )
                Stepper(
                    label = strings["qadha.ramadanYear"],
                    value = year.toString(),
                    strings = strings,
                    onDecrease = if (year > latestRamadanYear - MAX_YEARS_BACK) ({ year -= 1 }) else null,
                    onIncrease = if (year < latestRamadanYear) ({ year += 1 }) else null,
                )
                Text(strings["qadha.reason"], style = MaterialTheme.typography.labelLarge)
                FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    QadhaReason.all.forEach { option ->
                        FilterChip(
                            selected = reason == option,
                            onClick = { reason = option },
                            label = { Text(strings["qadha.reason.$option"]) },
                        )
                    }
                }
            }
        },
        confirmButton = {
            TextButton(onClick = { onConfirm(count, year, reason) }) { Text(strings["qadha.add"]) }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text(strings["common.cancel"]) }
        },
    )
}
