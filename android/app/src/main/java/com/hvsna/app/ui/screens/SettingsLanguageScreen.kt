package com.hvsna.app.ui.screens

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LargeTopAppBar
import androidx.compose.material3.ListItem
import androidx.compose.material3.ListItemDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.RadioButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.compose.ui.res.vectorResource
import com.hvsna.app.R
import com.hvsna.app.data.AppLanguage
import com.hvsna.app.data.AppSettings
import com.hvsna.app.data.SettingsRepository
import com.hvsna.app.i18n.LocalStrings
import kotlinx.coroutines.launch

private val LanguageOptions = listOf(
    AppLanguage.SYSTEM to "language.system",
    AppLanguage.ENGLISH to "language.english",
    AppLanguage.INDONESIAN to "language.indonesian",
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsLanguageScreen(
    settingsRepository: SettingsRepository,
    onBack: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val strings = LocalStrings.current
    val scope = rememberCoroutineScope()
    val settings by settingsRepository.settings.collectAsState(initial = AppSettings())
    val scrollBehavior = TopAppBarDefaults.exitUntilCollapsedScrollBehavior()

    Scaffold(
        modifier = modifier
            .fillMaxSize()
            .nestedScroll(scrollBehavior.nestedScrollConnection),
        topBar = {
            LargeTopAppBar(
                title = { Text(strings["language.title"]) },
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
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(innerPadding)
                .verticalScroll(rememberScrollState()),
        ) {
            LanguageOptions.forEach { (language, labelKey) ->
                val selected = settings.language == language
                ListItem(
                    headlineContent = { Text(strings[labelKey]) },
                    trailingContent = {
                        RadioButton(
                            selected = selected,
                            onClick = { scope.launch { settingsRepository.updateLanguage(language) } },
                        )
                    },
                    colors = ListItemDefaults.colors(containerColor = MaterialTheme.colorScheme.surface),
                    modifier = Modifier
                        .fillMaxWidth()
                        .selectable(
                            selected = selected,
                            onClick = { scope.launch { settingsRepository.updateLanguage(language) } },
                        ),
                )
            }
        }
    }
}
