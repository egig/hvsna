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
import com.hvsna.app.data.isVirtual
import com.hvsna.app.reminder.ReminderScheduler
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.drop
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import java.util.Calendar

private const val MAGHRIB_RECHECK_INTERVAL_MS = 60_000L

data class RecurringSeriesUiModel(val rule: RecurrenceRule, val nextOccurrence: Task, val tags: List<Tag> = emptyList())

/** Which occurrences a recurring-task edit or delete applies to. */
enum class RecurringScope { THIS_ONLY, ALL_FUTURE }

/** A recurring-task edit captured from the form, awaiting the user's scope choice. */
data class PendingRecurringEdit(
    val original: Task,
    val edited: Task,
    val tagIds: List<String>,
    val recurrence: RecurrenceInput,
)

private const val UPCOMING_HORIZON_DAYS = 365L

/**
 * Emitted after a task's done state is flipped via [TaskViewModel.toggleDone], so the UI
 * can surface an "Undo" snackbar (mirrors the web app's task-list-item.tsx behavior).
 * [taskId] is the real (materialized) task id; [nowDone] is the state it was just set to.
 */
data class TaskDoneToggled(val taskId: String, val nowDone: Boolean)

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

    private val _doneToggleEvents = MutableSharedFlow<TaskDoneToggled>(extraBufferCapacity = 4)
    /** Fires each time [toggleDone] flips a task; the UI listens to show an Undo snackbar. */
    val doneToggleEvents: SharedFlow<TaskDoneToggled> = _doneToggleEvents.asSharedFlow()

    /** Holds a just-completed task in its list for a beat so the tick/strike land before it animates out. */
    private val completionGrace = CompletionGraceTracker(viewModelScope)

    private val byScheduledTime: Comparator<TaskWithTags> = compareBy(nullsLast()) { it.task.scheduledTime }
    private val byTitle: Comparator<TaskWithTags> = compareBy { it.task.title.lowercase() }

    private fun todayStart(): Long {
        return Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }.timeInMillis
    }

    private fun tomorrowStart(): Long = todayStart() + 86_400_000L
    private fun dayAfterTomorrowStart(): Long = todayStart() + 2 * 86_400_000L

    /** Maghrib epoch for the calendar day starting at [dayStart], or null without a location. */
    private fun maghribEpochFor(dayStart: Long, appSettings: AppSettings): Long? {
        if (!appSettings.hasLocation) return null
        val cal = Calendar.getInstance().apply { timeInMillis = dayStart }
        return prayerTimesRepository.getPrayerList(
            cal.get(Calendar.YEAR), cal.get(Calendar.MONTH) + 1, cal.get(Calendar.DAY_OF_MONTH),
            appSettings.lat, appSettings.lng, appSettings.calculationMethod, appSettings.madhab,
        ).firstOrNull { it.first == "Maghrib" }?.second
    }

    private fun tickerFlow(periodMs: Long): Flow<Unit> = flow {
        while (true) {
            emit(Unit)
            delay(periodMs)
        }
    }

    val settings: StateFlow<AppSettings> = settingsRepository.settings
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), AppSettings())

    /**
     * Once today's Maghrib has passed, the Today screen's task window extends
     * into tomorrow (up to tomorrow's end of day) the same way the web app's
     * useToday() does — mirrors [todayStart]/[tomorrowStart] as an *exclusive*
     * upper bound for [TaskRepository.getToday]. Re-evaluated every minute
     * since Maghrib passing isn't otherwise a state change that recomposes.
     */
    private val todayTaskWindowEnd: StateFlow<Long> = combine(settings, tickerFlow(MAGHRIB_RECHECK_INTERVAL_MS)) { s, _ -> s }
        .map { s ->
            val maghrib = maghribEpochFor(todayStart(), s)
            val isAfterMaghrib = maghrib != null && System.currentTimeMillis() >= maghrib
            if (isAfterMaghrib) dayAfterTomorrowStart() else tomorrowStart()
        }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), tomorrowStart())

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
    }.let { completionGrace.retain(it, byScheduledTime) }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    val todayTasks: StateFlow<List<TaskWithTags>> = todayTaskWindowEnd
        .flatMapLatest { windowEnd ->
            withVirtualOccurrences(repository.getToday(todayStart(), windowEnd), todayStart(), windowEnd - 1)
        }
        .let { completionGrace.retain(it, byScheduledTime) }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    val completedTasks: StateFlow<List<TaskWithTags>> =
        completionGrace.suppressHeld(repository.getCompleted(todayStart(), tomorrowStart()))
            .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    val upcomingTasks: StateFlow<List<TaskWithTags>> =
        withVirtualOccurrences(
            repository.getUpcoming(tomorrowStart()),
            tomorrowStart(),
            tomorrowStart() + UPCOMING_HORIZON_DAYS * 86_400_000L,
        ).let { completionGrace.retain(it, byScheduledTime) }
            .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    val unscheduledTasks: StateFlow<List<TaskWithTags>> =
        completionGrace.retain(repository.getUnscheduled(), byTitle)
            .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    val browseTasks: StateFlow<List<TaskWithTags>> =
        withVirtualOccurrences(
            repository.getBrowse(),
            todayStart(),
            todayStart() + UPCOMING_HORIZON_DAYS * 86_400_000L,
        ).let { completionGrace.retain(it, byScheduledTime) }
            .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    val allCompletedTasks: StateFlow<List<TaskWithTags>> =
        completionGrace.suppressHeld(repository.getAllCompleted())
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
        .let { completionGrace.retain(it, byScheduledTime) }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    fun search(query: String) {
        _searchQuery.value = query
    }

    /** Real tagged tasks plus, per recurring series that carries this tag, its one overdue occurrence (if any) and its one next occurrence (within [UPCOMING_HORIZON_DAYS]) — not every future instance. */
    fun tasksForTag(tagId: String): Flow<List<TaskWithTags>> {
        val start = todayStart()
        val horizon = start + UPCOMING_HORIZON_DAYS * 86_400_000L
        return completionGrace.retain(
            combine(
                repository.getTasksForTag(tagId),
                repository.getAllRecurrenceRulesWithTags(),
                settings,
            ) { real, rules, appSettings ->
                val taggedRules = rules.filter { entry -> entry.tags.any { it.id == tagId } }
                val overdue = taggedRules.mapNotNull { entry ->
                    recurrenceManager.overdueOccurrenceFor(entry.rule, start, appSettings)
                        ?.let { TaskWithTags(it, entry.tags) }
                }
                val next = taggedRules.mapNotNull { entry ->
                    recurrenceManager.nextOccurrenceFor(entry.rule, start, horizon, appSettings)
                        ?.let { TaskWithTags(it, entry.tags) }
                }
                real + (overdue + next).filter { it.task.isDone == 0 }
            },
            byScheduledTime,
        )
    }

    /**
     * Save path for **non-recurring-original** edits only: brand-new tasks
     * (`original == null`), plain updates, and promoting a regular task into a
     * new series (`recurrence.enabled && original.recurringTaskId == null`).
     * Editing an existing series goes through [editRecurring] after the user
     * picks a scope in the dialog — matching web's task-form-edit-hook.
     */
    fun upsert(original: Task?, edited: Task, tagIds: List<String>, recurrence: RecurrenceInput = RecurrenceInput.None) = viewModelScope.launch {
        val now = System.currentTimeMillis()
        var taskToSave = edited.copy(updatedAt = now, _dirty = 1)

        taskToSave = when {
            original == null -> { repository.insert(taskToSave); taskToSave }
            original.isVirtual() -> recurrenceManager.materialize(original, taskToSave)
            else -> { repository.update(taskToSave); taskToSave }
        }

        repository.setTagsForTask(taskToSave.id, tagIds)
        reminderScheduler.sync(taskToSave, settings.value.remindersEnabled)

        if (recurrence.enabled && original?.recurringTaskId == null) {
            recurrenceManager.createSeries(taskToSave, recurrence, tagIds)
        }
    }

    /**
     * Applies an edit to an occurrence of an existing series at the chosen
     * [scope]. [recurrence] still-enabled → edit; toggled off → demote.
     * Mirrors web's handleScopeThisOnly / handleScopeAllFuture.
     */
    fun editRecurring(
        original: Task,
        edited: Task,
        tagIds: List<String>,
        recurrence: RecurrenceInput,
        scope: RecurringScope,
    ) = viewModelScope.launch {
        val recurringTaskId = original.recurringTaskId ?: return@launch
        val now = System.currentTimeMillis()
        val stamped = edited.copy(updatedAt = now, _dirty = 1)
        val result = when {
            recurrence.enabled && scope == RecurringScope.THIS_ONLY ->
                recurrenceManager.editSeriesThisOnly(original, stamped, tagIds)
            recurrence.enabled ->
                recurrenceManager.editSeriesAllFuture(recurringTaskId, original, stamped, recurrence, tagIds)
            scope == RecurringScope.THIS_ONLY ->
                recurrenceManager.demoteThisOnly(original, stamped, tagIds)
            else ->
                recurrenceManager.demoteAllFuture(recurringTaskId, original, stamped, tagIds)
        }
        if (original.isVirtual()) reminderScheduler.cancel(original.id)
        reminderScheduler.sync(result, settings.value.remindersEnabled)
    }

    fun delete(task: Task) = viewModelScope.launch {
        if (!task.isVirtual()) {
            repository.delete(task.id)
            reminderScheduler.cancel(task.id)
        }
    }

    /**
     * Deletes an occurrence of a series at the chosen [scope] — "this task only"
     * removes just this occurrence (materializing a virtual first so the slot is
     * recorded as an exception), "all future" stops the whole series.
     * Mirrors web's handleDeleteSingle / handleDeleteAll.
     */
    fun deleteRecurring(task: Task, scope: RecurringScope) = viewModelScope.launch {
        val recurringTaskId = task.recurringTaskId ?: return@launch
        when (scope) {
            RecurringScope.THIS_ONLY -> {
                val real = if (task.isVirtual()) recurrenceManager.materialize(task) else task
                repository.delete(real.id)
                reminderScheduler.cancel(real.id)
                if (task.isVirtual()) reminderScheduler.cancel(task.id)
            }
            RecurringScope.ALL_FUTURE -> {
                recurrenceManager.stopSeries(recurringTaskId, exceptTaskId = "")
                reminderScheduler.cancel(task.id)
            }
        }
    }

    fun toggleDone(entry: TaskWithTags) = viewModelScope.launch {
        val nowDone = entry.task.isDone == 0
        val target = if (entry.task.isVirtual()) recurrenceManager.materialize(entry.task) else entry.task
        val updated = doneCopy(target, nowDone)
        if (nowDone) {
            // Hold the row in its list for a beat *before* the DB write lands so the tick and
            // strike-through register in place, then it animates out — see CompletionGraceTracker.
            completionGrace.markCompleted(TaskWithTags(updated, entry.tags))
        } else {
            completionGrace.release(updated.id)
        }
        persistDone(updated)
        _doneToggleEvents.tryEmit(TaskDoneToggled(updated.id, nowDone))
    }

    /**
     * Restores a task to [restoreDone] after the user taps Undo on the toggle snackbar. Clears
     * any in-flight grace hold first, then looks the task up fresh (the toggle already wrote).
     */
    fun undoToggleDone(taskId: String, restoreDone: Boolean) = viewModelScope.launch {
        completionGrace.release(taskId)
        val task = repository.getTaskById(taskId) ?: return@launch
        persistDone(doneCopy(task, restoreDone))
    }

    private fun doneCopy(task: Task, done: Boolean): Task {
        val now = System.currentTimeMillis()
        return task.copy(
            isDone = if (done) 1 else 0,
            completedTime = if (done) now else null,
            updatedAt = now,
            _dirty = 1,
        )
    }

    private suspend fun persistDone(task: Task) {
        repository.update(task)
        reminderScheduler.sync(task, settings.value.remindersEnabled)
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
