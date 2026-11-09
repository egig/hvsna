package com.hvsna.app.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.hvsna.app.data.MadeUpDateCheck
import com.hvsna.app.data.QadhaFast
import com.hvsna.app.data.QadhaRepository
import com.hvsna.app.data.QadhaYearSummary
import com.hvsna.app.data.SettingsRepository
import com.hvsna.app.data.hasDelayedQadha
import com.hvsna.app.data.latestRamadanYear
import com.hvsna.app.data.summarizeQadhaByYear
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import java.time.LocalDate

data class QadhaUiState(
    val loaded: Boolean = false,
    /** Live rows, newest activity first: owed rows (oldest Ramadan first), then made-up rows (latest first). */
    val rows: List<QadhaFast> = emptyList(),
    val summaries: List<QadhaYearSummary> = emptyList(),
    val totalOwed: Int = 0,
    /** A later Ramadan has started while an earlier one's fast is still owed (fidyah note). */
    val hasDelayed: Boolean = false,
    /** The most recent Ramadan that has started — the default year for new owed days. */
    val latestRamadanYear: Int = 0,
    val hijriMonthOffsets: Map<Int, Int> = emptyMap(),
)

class QadhaViewModel(
    private val repository: QadhaRepository,
    private val settingsRepository: SettingsRepository,
) : ViewModel() {

    val state: StateFlow<QadhaUiState> = combine(repository.liveRows, settingsRepository.settings) { rows, settings ->
        val today = LocalDate.now()
        val offsets = settings.hijriMonthOffsets
        val owed = rows.filter { it.madeUpOn == null }
            .sortedWith(compareBy<QadhaFast> { it.ramadanHijriYear }.thenBy(nullsLast()) { it.missedDate }.thenBy { it.createdAt })
        val madeUp = rows.filter { it.madeUpOn != null }.sortedByDescending { it.madeUpOn }
        QadhaUiState(
            loaded = true,
            rows = owed + madeUp,
            summaries = summarizeQadhaByYear(rows),
            totalOwed = owed.size,
            hasDelayed = hasDelayedQadha(rows, today, offsets),
            latestRamadanYear = latestRamadanYear(today, offsets),
            hijriMonthOffsets = offsets,
        )
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), QadhaUiState())

    fun addOwed(count: Int, ramadanHijriYear: Int, reason: String) {
        viewModelScope.launch { repository.addOwed(count, ramadanHijriYear, reason) }
    }

    /** Validates and, when allowed, records a made-up fast; [onResult] gets the check outcome on the main thread. */
    fun logMadeUp(date: LocalDate, confirmedWarning: Boolean = false, onResult: (MadeUpDateCheck) -> Unit) {
        viewModelScope.launch {
            val offsets = settingsRepository.settings.first().hijriMonthOffsets
            onResult(repository.logMadeUp(date, LocalDate.now(), offsets, confirmedWarning))
        }
    }

    fun markOwedAgain(row: QadhaFast) {
        viewModelScope.launch { repository.markOwedAgain(row) }
    }

    fun delete(row: QadhaFast) {
        viewModelScope.launch { repository.delete(row) }
    }

    class Factory(
        private val repository: QadhaRepository,
        private val settingsRepository: SettingsRepository,
    ) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T =
            QadhaViewModel(repository, settingsRepository) as T
    }
}
