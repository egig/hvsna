import type { RecurringTask } from "./recurring-task";
import { useTaskEpoch } from "./task-form-helpers";
import { Task, type TaskRecurringType } from "@/domain/task";
import dayjs from "dayjs";

/**
 * Pure (no DB calls). Returns epoch millis for every occurrence of
 * a template that falls within [startEpoch, endEpoch].
 * Respects repeatEnd constraints. Hard-capped at 400 iterations.
 * All date calculations use the Gregorian calendar.
 */
export function useRecurringOccurance() {
  const getTaskEpoch = useTaskEpoch();

  /**
   * Returns the epoch of the latest occurrence strictly before beforeEpoch,
   * or null if the series hasn't started yet.
   * Looks back at most 60 days to avoid unbounded iteration.
   */
  function findLatestOccurrenceBefore(
    template: RecurringTask,
    beforeEpoch: number
  ): number | null {
    const lookbackMs = 60 * 24 * 60 * 60 * 1000;
    const occurrences = computeOccurrencesInRange(
      template,
      beforeEpoch - lookbackMs,
      beforeEpoch - 1
    );
    if (occurrences.length === 0) return null;
    return occurrences[occurrences.length - 1];
  }

  const computeOccurrencesInRange = (
    template: RecurringTask,
    startEpoch: number,
    endEpoch: number
  ): number[] => {
    const interval = template.recurringInterval ?? 1;

    const effectiveEnd =
      template.recurringEnd === "on_date" && template.recurringEndEpoch
        ? Math.min(endEpoch, template.recurringEndEpoch)
        : endEpoch;

    if (template.baseDateEpoch > effectiveEnd) return [];

    let currentDateStr = dayjs(template.baseDateEpoch).format("YYYY-MM-DD");

    const maxOccurrences =
      template.recurringEnd === "after_occurrences" &&
      template.recurringEndOccurrences
        ? template.recurringEndOccurrences
        : Infinity;

    const results: number[] = [];
    let totalCount = 0;
    let iterations = 0;

    while (iterations < 400 && totalCount < maxOccurrences) {
      const epoch = getTaskEpoch(
        dayjs(currentDateStr).toDate(),
        template.atTime as string
      ) as number;

      if (epoch > effectiveEnd) break;
      if (epoch >= startEpoch) results.push(epoch);

      totalCount++;

      const nextStr = getNextOccurrenceDate(
        currentDateStr,
        template.recurringType,
        interval
      );
      if (!nextStr) break;
      currentDateStr = nextStr;
      iterations++;
    }

    return results;
  };

  /**
   * Builds ephemeral virtual Task objects for all templates within
   * [startEpoch, endEpoch], skipping dates that are in occurrenceExceptions.
   * Also surfaces at most one overdue virtual per template.
   */
  async function buildVirtualTasksForRange(
    templates: RecurringTask[],
    startEpoch: number,
    endEpoch: number
  ): Promise<Task[]> {
    const all: Task[] = [];

    for (const template of templates) {
      const exceptionsSet = new Set(template.occurrenceExceptions ?? []);
      const occurrences = computeOccurrencesInRange(
        template,
        startEpoch,
        endEpoch
      );

      for (const epoch of occurrences) {
        if (exceptionsSet.has(dayjs(epoch).format("YYYYMMDD"))) continue;
        all.push(createVirtualTask(template, epoch));
      }

      const overdueEpoch = findLatestOccurrenceBefore(template, startEpoch);
      if (overdueEpoch !== null) {
        if (!exceptionsSet.has(dayjs(overdueEpoch).format("YYYYMMDD"))) {
          all.push(createVirtualTask(template, overdueEpoch));
        }
      }
    }

    return all;
  }

  /**
   * Returns the next occurrence date string (YYYY-MM-DD) given a current
   * Gregorian date string and repeat configuration.
   */
  function getNextOccurrenceDate(
    atDateStr: string,
    recurringType: TaskRecurringType,
    interval = 1
  ): string | null {
    if (!recurringType || recurringType === "none" || !atDateStr) return null;
    const n = Math.max(1, interval);
    const current = dayjs(atDateStr);

    if (recurringType === "daily")
      return current.add(n, "day").format("YYYY-MM-DD");
    if (recurringType === "weekly")
      return current.add(n * 7, "day").format("YYYY-MM-DD");
    if (recurringType === "monthly")
      return current.add(n, "month").format("YYYY-MM-DD");
    if (recurringType === "yearly")
      return current.add(n, "year").format("YYYY-MM-DD");

    return null;
  }

  return {
    computeOccurrencesInRange,
    findLatestOccurrenceBefore,
    buildVirtualTasksForRange,
    getNextOccurrenceDate,
  };
}

function createVirtualTask(template: RecurringTask, epoch: number): Task {
  return new Task({
    id: `vtask_${template.id}_${epoch}`,
    isVirtual: true,
    recurringTaskId: template.id,
    name: template.name,
    description: template.description,
    atEpochMillis: epoch,
    atTime: template.atTime,
    recurringType: template.recurringType,
    recurringInterval: template.recurringInterval ?? 1,
    lat: template.lat,
    long: template.long,
    timezone: template.timezone,
    hijriDateOffset: template.hijriDateOffset,
    tags: template.tags ?? [],
    status: 0,
  });
}
