package com.hvsna.app.ui.screens

import android.Manifest
import android.content.pm.PackageManager
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LargeTopAppBar
import androidx.compose.material3.ListItem
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import com.hvsna.app.data.CityResult
import com.hvsna.app.data.LocationRepository
import com.hvsna.app.data.SettingsRepository
import compose.icons.TablerIcons
import compose.icons.tablericons.ArrowLeft
import compose.icons.tablericons.Search
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsLocationScreen(
    settingsRepository: SettingsRepository,
    locationRepository: LocationRepository,
    onBack: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val settings by settingsRepository.settings.collectAsState(initial = com.hvsna.app.data.AppSettings())

    var searchQuery by remember { mutableStateOf("") }
    var searchResults by remember { mutableStateOf<List<CityResult>>(emptyList()) }
    var isSearching by remember { mutableStateOf(false) }
    var isDetecting by remember { mutableStateOf(false) }

    // On a transient reverse-geocode failure, keep whatever city name is already
    // persisted rather than clobbering it with a raw coordinate string; only fall
    // back to coordinates when there's no prior name to fall back to.
    suspend fun detectAndUpdateLocation() {
        val location = locationRepository.getLastLocation()
        if (location != null) {
            val cityName = locationRepository.reverseGeocode(location.first, location.second)
                ?: settings.cityName.ifEmpty { "${location.first}, ${location.second}" }
            settingsRepository.updateLocation(location.first, location.second, cityName)
        }
    }

    val locationPermissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted ->
        if (granted) {
            isDetecting = true
            scope.launch {
                detectAndUpdateLocation()
                isDetecting = false
            }
        }
    }

    fun detectLocation() {
        val hasPermission = ContextCompat.checkSelfPermission(
            context, Manifest.permission.ACCESS_COARSE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED

        if (hasPermission) {
            isDetecting = true
            scope.launch {
                detectAndUpdateLocation()
                isDetecting = false
            }
        } else {
            locationPermissionLauncher.launch(Manifest.permission.ACCESS_COARSE_LOCATION)
        }
    }

    val scrollBehavior = TopAppBarDefaults.exitUntilCollapsedScrollBehavior()

    Scaffold(
        modifier = modifier
            .fillMaxSize()
            .nestedScroll(scrollBehavior.nestedScrollConnection),
        topBar = {
            LargeTopAppBar(
                title = { Text("Location") },
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
            Text(
                if (settings.cityName.isNotEmpty()) settings.cityName else "Location not set",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )

            Button(
                onClick = { detectLocation() },
                enabled = !isDetecting,
                modifier = Modifier.fillMaxWidth(),
            ) {
                if (isDetecting) {
                    CircularProgressIndicator(
                        modifier = Modifier.padding(end = 8.dp),
                        strokeWidth = 2.dp,
                        color = MaterialTheme.colorScheme.onPrimary,
                    )
                }
                Text(if (isDetecting) "Detecting…" else "Use GPS")
            }

            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                label = { Text("Search city") },
                singleLine = true,
                trailingIcon = {
                    IconButton(
                        onClick = {
                            if (searchQuery.isNotBlank()) {
                                isSearching = true
                                scope.launch {
                                    searchResults = locationRepository.searchCity(searchQuery)
                                    isSearching = false
                                }
                            }
                        },
                    ) {
                        if (isSearching) {
                            CircularProgressIndicator(strokeWidth = 2.dp)
                        } else {
                            Icon(TablerIcons.Search, contentDescription = "Search")
                        }
                    }
                },
                modifier = Modifier.fillMaxWidth(),
            )

            if (searchResults.isNotEmpty()) {
                Column {
                    searchResults.forEach { result ->
                        ListItem(
                            headlineContent = { Text(result.name, maxLines = 2) },
                            modifier = Modifier.clickable {
                                scope.launch {
                                    settingsRepository.updateLocation(result.lat, result.lng, result.name)
                                    searchResults = emptyList()
                                    searchQuery = ""
                                }
                            },
                        )
                        HorizontalDivider()
                    }
                }
            }
        }
    }
}
