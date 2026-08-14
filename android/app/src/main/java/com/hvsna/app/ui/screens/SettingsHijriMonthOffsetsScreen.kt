package com.hvsna.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LargeTopAppBar
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.compose.ui.unit.dp
import com.hvsna.app.data.AppSettings
import com.hvsna.app.data.SettingsRepository
import com.hvsna.app.data.hijriDateParts
import com.hvsna.app.data.hijriMonthNames
import compose.icons.TablerIcons
import compose.icons.tablericons.ArrowLeft
import compose.icons.tablericons.Minus
import compose.icons.tablericons.Plus
import java.time.LocalDate
import kotlin.math.abs
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsHijriMonthOffsetsScreen(
    settingsRepository: SettingsRepository,
    onBack: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val scope = rememberCoroutineScope()
    val settings by settingsRepository.settings.collectAsState(initial = AppSettings())
    val monthOffsets = settings.hijriMonthOffsets

    val today = LocalDate.now()
    val todayWithoutOffset = hijriDateParts(today)
    val todayWithOffset = hijriDateParts(today, monthOffsets)
    val datesDiffer = todayWithoutOffset != todayWithOffset

    val scrollBehavior = TopAppBarDefaults.exitUntilCollapsedScrollBehavior()

    Scaffold(
        modifier = modifier
            .fillMaxSize()
            .nestedScroll(scrollBehavior.nestedScrollConnection),
        topBar = {
            LargeTopAppBar(
                title = { Text("Hijri Date") },
                scrollBehavior = scrollBehavior,
                colors = TopAppBarDefaults.largeTopAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface,
                    scrolledContainerColor = MaterialTheme.colorScheme.surface,
                ),
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(TablerIcons.ArrowLeft, contentDescription = "Back")
                    }
                },
            )
        },
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(innerPadding)
                .verticalScroll(rememberScrollState()),
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 12.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                Text(
                    "Shift the displayed Hijri date per month if it doesn't match your local moon sighting.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                ) {
                    Text("Today", style = MaterialTheme.typography.bodyMedium)
                    Text(
                        "${todayWithoutOffset.day} ${todayWithoutOffset.monthName} ${todayWithoutOffset.year}",
                        style = MaterialTheme.typography.bodyMedium,
                    )
                }
                if (datesDiffer) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                    ) {
                        Text("With offset", style = MaterialTheme.typography.bodyMedium)
                        Text(
                            "${todayWithOffset.day} ${todayWithOffset.monthName} ${todayWithOffset.year}",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.primary,
                        )
                    }
                }
            }

            HorizontalDivider()

            hijriMonthNames.forEachIndexed { index, monthName ->
                val month = index + 1
                val currentOffset = monthOffsets[month] ?: 0
                val nextOffset = if (month < 12) monthOffsets[month + 1] ?: 0 else currentOffset
                val showGapWarning = month < 12 && abs(currentOffset - nextOffset) > 1

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 8.dp),
                ) {
                    Text(monthName, style = MaterialTheme.typography.bodyLarge)
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp),
                    ) {
                        IconButton(
                            onClick = {
                                scope.launch {
                                    settingsRepository.updateHijriMonthOffsets(monthOffsets + (month to currentOffset - 1))
                                }
                            },
                            enabled = currentOffset > -2,
                        ) {
                            Icon(TablerIcons.Minus, contentDescription = "Decrease")
                        }
                        Text(
                            if (currentOffset == 0) "0" else "%+d".format(currentOffset),
                            style = MaterialTheme.typography.bodyMedium,
                            modifier = Modifier.padding(horizontal = 4.dp),
                        )
                        IconButton(
                            onClick = {
                                scope.launch {
                                    settingsRepository.updateHijriMonthOffsets(monthOffsets + (month to currentOffset + 1))
                                }
                            },
                            enabled = currentOffset < 2,
                        ) {
                            Icon(TablerIcons.Plus, contentDescription = "Increase")
                        }
                    }
                }

                if (showGapWarning) {
                    Text(
                        "Offset jumps by more than a day from $monthName to ${hijriMonthNames[month]} — " +
                            "moon sighting shifts are usually gradual month to month.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onTertiaryContainer,
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 4.dp)
                            .background(MaterialTheme.colorScheme.tertiaryContainer, RoundedCornerShape(8.dp))
                            .padding(8.dp),
                    )
                }

                if (month < 12) HorizontalDivider()
            }
        }
    }
}
