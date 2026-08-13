package com.hvsna.app.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.hvsna.app.data.AppSettings
import com.hvsna.app.data.PrayerTimesRepository
import com.hvsna.app.data.RecurrenceInput
import com.hvsna.app.data.RecurrenceManager
import com.hvsna.app.data.RecurrenceRule
import com.hvsna.app.data.SettingsRepository
import com.hvsna.app.data.Tag
import com.hvsna.app.data.Task
import com.hvsna.app.data.TaskRepository
import com.hvsna.app.data.TaskWithTags
import com.hvsna.app.reminder.ReminderScheduler
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.drop
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import java.util.Calendar

data class RecurringSeriesUiModel(val rule: RecurrenceRule, val nextOccurrence: TaskWithTags)

@OptIn(ExperimentalCoroutinesApi::class)
class TaskViewModel(
    private val repository: TaskRepository,
    private val settingsRepository: SettingsRepository,
    private val prayerTimesRepository: PrayerTimesRepository,
    private val recurrenceManager: RecurrenceManager,
    private val reminderScheduler: ReminderScheduler,
) : ViewModel() {

    init {
        viewModelScope.launch {
            recurrenceManager.materializeAll(settingsRepository.settings.first())
        }
        viewModelScope.launch {
            settingsRepository.settings.drop(1).collectLatest { recurrenceManager.recomputeAllPrayerAnchoredTasks(it) }
        }
    }

    private fun todayStart(): Long {
        return Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }.timeInMillis
    }

    private fun tomorrowStart(): Long = todayStart() + 86_400_000L

    val overdueTasks: StateFlow<List<TaskWithTags>> = repository
        .getOverdue(todayStart())
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    val todayTasks: StateFlow<List<TaskWithTags>> = repository
        .getToday(todayStart(), tomorrowStart())
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    val completedTasks: StateFlow<List<TaskWithTags>> = repository
        .getCompleted(todayStart(), tomorrowStart())
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    val upcomingTasks: StateFlow<List<TaskWithTags>> = repository
        .getUpcoming(tomorrowStart())
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    val unscheduledTasks: StateFlow<List<TaskWithTags>> = repository
        .getUnscheduled()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    val browseTasks: StateFlow<List<TaskWithTags>> = repository
        .getBrowse()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    val allCompletedTasks: StateFlow<List<TaskWithTags>> = repository
        .getAllCompleted()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    val allTags: StateFlow<List<Tag>> = repository
        .getAllTags()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    val allRecurrenceRules: StateFlow<List<RecurrenceRule>> = repository
        .getAllRecurrenceRules()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    val recurringSeries: StateFlow<List<RecurringSeriesUiModel>> = combine(
        repository.getAllRecurrenceRules(),
        repository.getNextOccurrencePerSeries(),
    ) { rules, next ->
        val byRuleId = next.associateBy { it.task.recurrenceId }
        rules.mapNotNull { rule -> byRuleId[rule.id]?.let { RecurringSeriesUiModel(rule, it) } }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery

    val searchResults: StateFlow<List<TaskWithTags>> = _searchQuery
        .flatMapLatest { query -> repository.search(query) }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    val settings: StateFlow<AppSettings> = settingsRepository.settings
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), AppSettings())

    fun search(query: String) {
        _searchQuery.value = query
    }

    fun tasksForTag(tagId: Int): Flow<List<TaskWithTags>> = repository.getTasksForTag(tagId)

    fun upsert(task: Task, tagIds: List<Int>, recurrence: RecurrenceInput = RecurrenceInput.None) = viewModelScope.launch {
        var taskToSave = task
        if (task.recurrenceId != null && !recurrence.enabled) {
            recurrenceManager.stopSeries(task.recurrenceId, exceptTaskId = task.id)
            taskToSave = task.copy(recurrenceId = null)
        }

        val taskId = if (taskToSave.id == 0) repository.insert(taskToSave).toInt() else {
            repository.update(taskToSave)
            taskToSave.id
        }
        repository.setTagsForTask(taskId, tagIds)
        reminderScheduler.sync(taskToSave.copy(id = taskId), settings.value.remindersEnabled)

        if (recurrence.enabled && task.recurrenceId == null) {
            recurrenceManager.createSeries(taskToSave.copy(id = taskId), recurrence.intervalCount, recurrence.unit, settings.value)
        } else if (recurrence.enabled && task.recurrenceId != null) {
            recurrenceManager.updateSeries(
                task.recurrenceId, taskToSave.copy(id = taskId),
                recurrence.intervalCount, recurrence.unit, tagIds, settings.value,
            )
        }
    }

    fun delete(task: Task) = viewModelScope.launch {
        if (task.recurrenceId != null && task.isDone == 0) {
            recurrenceManager.stopSeries(task.recurrenceId, exceptTaskId = task.id)
        }
        repository.delete(task)
        reminderScheduler.cancel(task.id)
    }

    fun toggleDone(task: Task) = viewModelScope.launch {
        val nowDone = task.isDone == 0
        val updated = task.copy(
            isDone = if (nowDone) 1 else 0,
            completedTime = if (nowDone) System.currentTimeMillis() else null,
        )
        repository.update(updated)
        reminderScheduler.sync(updated, settings.value.remindersEnabled)
    }

    suspend fun createTag(name: String): Tag {
        val color = 0xFF90A4AE // Default to Blue Grey
        val id = repository.insertTag(Tag(name = name, color = color))
        return Tag(id = id.toInt(), name = name, color = color)
    }

    fun updateTag(tag: Tag) = viewModelScope.launch {
        repository.updateTag(tag)
    }

    fun deleteTag(tag: Tag) = viewModelScope.launch {
        repository.deleteTag(tag)
    }

    fun getPrayerTimesForDate(year: Int, month: Int, day: Int): List<Pair<String, Long>> {
        val s = settings.value
        if (!s.hasLocation) return emptyList()
        return prayerTimesRepository.getPrayerList(year, month, day, s.lat, s.lng, s.calculationMethod, s.madhab)
    }

    class Factory(
        private val repository: TaskRepository,
        private val settingsRepository: SettingsRepository,
        private val prayerTimesRepository: PrayerTimesRepository,
        private val recurrenceManager: RecurrenceManager,
        private val reminderScheduler: ReminderScheduler,
    ) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T =
            TaskViewModel(repository, settingsRepository, prayerTimesRepository, recurrenceManager, reminderScheduler) as T
    }
}
