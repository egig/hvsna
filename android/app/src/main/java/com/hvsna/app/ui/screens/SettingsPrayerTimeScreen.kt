package com.hvsna.app.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuAnchorType
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LargeTopAppBar
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.compose.ui.unit.dp
import com.hvsna.app.data.SettingsRepository
import compose.icons.TablerIcons
import compose.icons.tablericons.ArrowLeft
import kotlinx.coroutines.launch

private val calculationMethods = listOf(
    "Muslim World League" to "MUSLIM_WORLD_LEAGUE",
    "Egyptian General Authority" to "EGYPTIAN",
    "University of Islamic Sciences, Karachi" to "KARACHI",
    "Umm al-Qura, Makkah" to "UMM_AL_QURA",
    "Dubai" to "DUBAI",
    "Moon Sighting Committee" to "MOON_SIGHTING_COMMITTEE",
    "North America (ISNA)" to "NORTH_AMERICA",
    "Kuwait" to "KUWAIT",
    "Qatar" to "QATAR",
    "Singapore" to "SINGAPORE",
    "Turkey" to "TURKEY",
    "Tehran" to "TEHRAN",
    "Other" to "OTHER",
)

private val madhabOptions = listOf(
    "Shafi, Maliki, Hanbali" to "SHAFI",
    "Hanafi" to "HANAFI",
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsPrayerTimeScreen(
    settingsRepository: SettingsRepository,
    onBack: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val scope = rememberCoroutineScope()
    val settings by settingsRepository.settings.collectAsState(initial = com.hvsna.app.data.AppSettings())

    var methodExpanded by remember { mutableStateOf(false) }
    var madhabExpanded by remember { mutableStateOf(false) }

    val currentMethodLabel = calculationMethods
        .firstOrNull { it.second == settings.calculationMethod }?.first
        ?: settings.calculationMethod

    val currentMadhabLabel = madhabOptions
        .firstOrNull { it.second == settings.madhab }?.first
        ?: settings.madhab

    val scrollBehavior = TopAppBarDefaults.exitUntilCollapsedScrollBehavior()

    Scaffold(
        modifier = modifier
            .fillMaxSize()
            .nestedScroll(scrollBehavior.nestedScrollConnection),
        topBar = {
            LargeTopAppBar(
                title = { Text("Prayer Time") },
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
                .padding(horizontal = 16.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            Text("Calculation Method", style = MaterialTheme.typography.titleMedium)

            ExposedDropdownMenuBox(
                expanded = methodExpanded,
                onExpandedChange = { methodExpanded = it },
            ) {
                OutlinedTextField(
                    value = currentMethodLabel,
                    onValueChange = {},
                    readOnly = true,
                    trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = methodExpanded) },
                    modifier = Modifier
                        .fillMaxWidth()
                        .menuAnchor(ExposedDropdownMenuAnchorType.PrimaryNotEditable),
                )
                ExposedDropdownMenu(
                    expanded = methodExpanded,
                    onDismissRequest = { methodExpanded = false },
                ) {
                    calculationMethods.forEach { (label, value) ->
                        DropdownMenuItem(
                            text = { Text(label) },
                            onClick = {
                                scope.launch { settingsRepository.updateCalculationMethod(value) }
                                methodExpanded = false
                            },
                        )
                    }
                }
            }

            Text("Madhab (Asr calculation)", style = MaterialTheme.typography.titleMedium)

            ExposedDropdownMenuBox(
                expanded = madhabExpanded,
                onExpandedChange = { madhabExpanded = it },
            ) {
                OutlinedTextField(
                    value = currentMadhabLabel,
                    onValueChange = {},
                    readOnly = true,
                    trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = madhabExpanded) },
                    modifier = Modifier
                        .fillMaxWidth()
                        .menuAnchor(ExposedDropdownMenuAnchorType.PrimaryNotEditable),
                )
                ExposedDropdownMenu(
                    expanded = madhabExpanded,
                    onDismissRequest = { madhabExpanded = false },
                ) {
                    madhabOptions.forEach { (label, value) ->
                        DropdownMenuItem(
                            text = { Text(label) },
                            onClick = {
                                scope.launch { settingsRepository.updateMadhab(value) }
                                madhabExpanded = false
                            },
                        )
                    }
                }
            }
        }
    }
}
