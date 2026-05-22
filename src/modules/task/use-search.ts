import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePouchDB } from "../../pouchdb";
import { createTaskUseCases } from "../../usecases/task";
import { createRecurringTaskUseCases } from "@/usecases/task/RecurringTaskUseCasesFactory";
import { Task, type TaskQuery, type TaskTypeFilter } from "@/domain/task";
import { HijriDate } from "../calendar/hijri";
import { useTaskContext } from "./task-context";
import { computeOccurrencesInRange } from "./recurring-task-generator";
import type { RecurringTask } from "./recurring-task";

const HORIZON_MS = 365 * 24 * 60 * 60 * 1000;

function recurringTemplateToVirtualTask(
  template: RecurringTask,
  nextEpoch: number | null
): Task {
  return new Task({
    id: `vtask_${template.id}_${nextEpoch ?? 0}`,
    isVirtual: true,
    recurringTaskId: template.id,
    name: template.name,
    description: template.description,
    atEpochMillis: nextEpoch ?? undefined,
    atTime: template.atTime,
    repeat: template.repeat,
    repeatInterval: template.repeatInterval ?? 1,
    lat: template.lat,
    long: template.long,
    timezone: template.timezone,
    hijriDateOffset: template.hijriDateOffset,
    tags: template.tags ?? [],
    status: 0,
    noDate: nextEpoch ? 0 : 1,
  });
}

export function useSearch() {
  const [initiated, setInitiated] = useState(false);

  const { openEditTaskForm } = useTaskContext();
  const { db } = usePouchDB();
  const taskUseCases = createTaskUseCases(db);
  const recurringTaskUseCases = createRecurringTaskUseCases(db);

  const [dateRangeFilter, setDateRangeFilter] = useState<{
    startDate: HijriDate;
    endDate: HijriDate;
  } | null>(null);
  const [searchTextFilter, setSearchTextFilter] = useState<string>("");
  const [unscheduledFilter, setUnscheduledFilter] = useState<boolean>(false);
  const [tagFilter, setTagFilter] = useState<string[]>([]);

  const clearFilters = useCallback(() => {
    setDateRangeFilter(null);
    setSearchTextFilter("");
    setUnscheduledFilter(false);
    setTagFilter([]);
  }, []);

  const filterKey = [
    dateRangeFilter
      ? `${dateRangeFilter.startDate.toString()}-${dateRangeFilter.endDate.toString()}`
      : "",
    searchTextFilter || "",
    unscheduledFilter ? "1" : "",
    tagFilter.join(","),
  ].join("|");

  const buildRegularTaskQuery = (): TaskQuery => {
    const query: TaskQuery = { status: 0 as const };

    if (searchTextFilter && searchTextFilter.trim()) {
      query.searchText = searchTextFilter;
    }

    if (dateRangeFilter) {
      const startEpoch = dateRangeFilter.startDate.toDate().valueOf();
      const endEpoch = dateRangeFilter.endDate.toDate().valueOf();
      query.atEpochMillis = {
        $gte: startEpoch,
        $lte: endEpoch,
      };
    }

    if (unscheduledFilter) {
      query.unscheduled = 1;
    }


    if (tagFilter.length > 0) {
      query.tags = tagFilter;
    }

    return query;
  };

  const searchQuery = useQuery({
    queryKey: ["search-tasks", filterKey],
    queryFn: async () => {
      const regularTasksPromise = taskUseCases.getTasks(buildRegularTaskQuery());

      const recurringTasksPromise = recurringTaskUseCases.getRecurringTasks()

      const [regularTasks, recurringTemplates] = await Promise.all([
        regularTasksPromise,
        recurringTasksPromise,
      ]);

      const searchLower = searchTextFilter.trim().toLowerCase();

      const filteredTemplates = recurringTemplates.filter((template) => {
        if (searchLower && !template.name.toLowerCase().includes(searchLower)) {
          return false;
        }
        if (tagFilter.length > 0) {
          const templateTags = template.tags ?? [];
          const hasTag = tagFilter.some((tag) => templateTags.includes(tag));
          if (!hasTag) return false;
        }
        return true;
      });

      const now = Date.now();
      const recurringVirtualTasks = filteredTemplates
        .map((template) => {
          const occurrences = computeOccurrencesInRange(
            template,
            now,
            now + HORIZON_MS
          );
          const nextEpoch = occurrences.length > 0 ? occurrences[0] : null;
          return { template, nextEpoch };
        })
        .filter(({ nextEpoch }) => nextEpoch !== null)
        .sort((a, b) => a.nextEpoch! - b.nextEpoch!)
        .map(({ template, nextEpoch }) =>
          recurringTemplateToVirtualTask(template, nextEpoch)
        );

      const regularTaskIds = new Set(
        regularTasks.map((t) => t.recurringTaskId).filter(Boolean)
      );
      const dedupedRecurring = recurringVirtualTasks.filter(
        (t) => !regularTaskIds.has(t.recurringTaskId ?? undefined)
      );

      return [...regularTasks, ...dedupedRecurring];
    },
    staleTime: 1000 * 60 * 2,
  });

  useEffect(() => {
    setInitiated(true);
  }, []);

  const openEditPopup = useCallback(
    (task: Task) => {
      openEditTaskForm(task.id as string, task);
    },
    [openEditTaskForm]
  );

  const refreshSearch = useCallback(() => {
    searchQuery.refetch();
  }, [searchQuery]);

  return {
    tasks: searchQuery.data || [],
    loading: searchQuery.isPending,
    initiated,
    error: searchQuery.error
      ? searchQuery.error instanceof Error
        ? searchQuery.error.message
        : "Unknown error"
      : null,

    dateRangeFilter,
    searchTextFilter,
    unscheduledFilter,
    tagFilter,

    refreshTasks: refreshSearch,
    openEditPopup,

    setDateRangeFilter,
    setSearchTextFilter,
    setUnscheduledFilter,
    setTagFilter,
    clearFilters,
  };
}
