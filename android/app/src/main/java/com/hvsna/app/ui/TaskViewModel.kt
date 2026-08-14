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
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import java.util.Calendar

data class RecurringSeriesUiModel(val rule: RecurrenceRule, val nextOccurrence: Task, val tags: List<Tag> = emptyList())

private const val UPCOMING_HORIZON_DAYS = 365L
private const val VIRTUAL_TASK_ID_PREFIX = "vtask_"

fun Task.isVirtual(): Boolean = id.startsWith(VIRTUAL_TASK_ID_PREFIX)

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

    val settings: StateFlow<AppSettings> = settingsRepository.settings
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), AppSettings())

    /** Merges real DB rows with lazily-computed virtual occurrences from every active RecurrenceRule in range — virtual rows inherit the owning rule's tags. */
    private fun withVirtualOccurrences(
        real: Flow<List<TaskWithTags>>,
        rangeStart: Long,
        rangeEnd: Long,
    ): Flow<List<TaskWithTags>> = combine(real, repository.getAllRecurrenceRulesWithTags(), settings) { realTasks, rules, appSettings ->
        val virtual = rules.flatMap { entry ->
            recurrenceManager.virtualOccurrencesFor(entry.rule, rangeStart, rangeEnd, appSettings)
                .map { TaskWithTags(it, entry.tags) }
        }.filter { it.task.isDone == 0 }
        (realTasks + virtual).sortedWith(compareBy(nullsLast()) { it.task.scheduledTime })
    }

    val overdueTasks: StateFlow<List<TaskWithTags>> = combine(
        repository.getOverdue(todayStart()),
        repository.getAllRecurrenceRulesWithTags(),
        settings,
    ) { real, rules, appSettings ->
        val virtual = rules.mapNotNull { entry ->
            recurrenceManager.overdueOccurrenceFor(entry.rule, todayStart(), appSettings)?.let { TaskWithTags(it, entry.tags) }
        }.filter { it.task.isDone == 0 }
        (real + virtual).sortedWith(compareBy(nullsLast()) { it.task.scheduledTime })
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    val todayTasks: StateFlow<List<TaskWithTags>> =
        withVirtualOccurrences(repository.getToday(todayStart(), tomorrowStart()), todayStart(), tomorrowStart() - 1)
            .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    val completedTasks: StateFlow<List<TaskWithTags>> = repository
        .getCompleted(todayStart(), tomorrowStart())
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    val upcomingTasks: StateFlow<List<TaskWithTags>> =
        withVirtualOccurrences(
            repository.getUpcoming(tomorrowStart()),
            tomorrowStart(),
            tomorrowStart() + UPCOMING_HORIZON_DAYS * 86_400_000L,
        ).stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    val unscheduledTasks: StateFlow<List<TaskWithTags>> = repository
        .getUnscheduled()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    val browseTasks: StateFlow<List<TaskWithTags>> =
        withVirtualOccurrences(
            repository.getBrowse(),
            todayStart(),
            todayStart() + UPCOMING_HORIZON_DAYS * 86_400_000L,
        ).stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

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
        repository.getAllRecurrenceRulesWithTags(),
        settings,
    ) { rules, appSettings ->
        val now = System.currentTimeMillis()
        val horizon = now + UPCOMING_HORIZON_DAYS * 86_400_000L
        rules.mapNotNull { entry ->
            recurrenceManager.nextOccurrenceFor(entry.rule, now, horizon, appSettings)
                ?.let { RecurringSeriesUiModel(entry.rule, it, entry.tags) }
        }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery

    val searchResults: StateFlow<List<TaskWithTags>> = _searchQuery
        .flatMapLatest { query -> repository.search(query) }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    fun search(query: String) {
        _searchQuery.value = query
    }

    fun tasksForTag(tagId: String): Flow<List<TaskWithTags>> = repository.getTasksForTag(tagId)

    /**
     * [original] is the task being edited (null when creating brand new) —
     * `null` vs. non-null decides insert-vs-update, and `original.isVirtual()`
     * decides whether [edited] needs materializing first, since a virtual
     * occurrence has no existing DB row for `update` to target.
     */
    fun upsert(original: Task?, edited: Task, tagIds: List<String>, recurrence: RecurrenceInput = RecurrenceInput.None) = viewModelScope.launch {
        val now = System.currentTimeMillis()
        var taskToSave = edited.copy(updatedAt = now, _dirty = 1)

        if (original?.recurringTaskId != null && !recurrence.enabled) {
            recurrenceManager.stopSeries(original.recurringTaskId, exceptTaskId = original.id)
            taskToSave = taskToSave.copy(recurringTaskId = null)
        }

        taskToSave = when {
            original == null -> { repository.insert(taskToSave); taskToSave }
            original.isVirtual() -> recurrenceManager.materialize(original, taskToSave)
            else -> { repository.update(taskToSave); taskToSave }
        }

        repository.setTagsForTask(taskToSave.id, tagIds)
        reminderScheduler.sync(taskToSave, settings.value.remindersEnabled)

        if (recurrence.enabled && original?.recurringTaskId == null) {
            recurrenceManager.createSeries(taskToSave, recurrence, tagIds)
        } else if (recurrence.enabled && original?.recurringTaskId != null) {
            recurrenceManager.updateSeries(original.recurringTaskId, taskToSave, recurrence, tagIds)
        }
    }

    fun delete(task: Task) = viewModelScope.launch {
        if (task.recurringTaskId != null && task.isDone == 0) {
            // Deleting any pending instance of a series stops the whole series —
            // matches the pre-existing behavior this app already had.
            recurrenceManager.stopSeries(task.recurringTaskId, exceptTaskId = task.id)
        }
        if (!task.isVirtual()) {
            repository.delete(task.id)
            reminderScheduler.cancel(task.id)
        }
    }

    fun toggleDone(task: Task) = viewModelScope.launch {
        val nowDone = task.isDone == 0
        val now = System.currentTimeMillis()
        val target = if (task.isVirtual()) recurrenceManager.materialize(task) else task
        val updated = target.copy(
            isDone = if (nowDone) 1 else 0,
            completedTime = if (nowDone) now else null,
            updatedAt = now,
            _dirty = 1,
        )
        repository.update(updated)
        reminderScheduler.sync(updated, settings.value.remindersEnabled)
    }

    suspend fun createTag(name: String): Tag {
        val color = 0xFF4b4953
        val tag = Tag(name = name, color = color)
        repository.insertTag(tag)
        return tag
    }

    fun updateTag(tag: Tag) = viewModelScope.launch {
        repository.updateTag(tag.copy(updatedAt = System.currentTimeMillis(), _dirty = 1))
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
