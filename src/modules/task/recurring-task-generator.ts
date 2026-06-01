import type { RecurringTask } from "./recurring-task";
import type { ITaskRepository } from "../../domain/task/ITaskRepository";
import { HijriDate, useHijriDate } from "../calendar/hijri";
import {
  parseHijriDateString,
  formatHijriDateString,
  useTaskEpoch,
} from "./task-form-helpers";
import { Task, type TaskRecurringType } from "@/domain/task";
import { hijriToGregorian } from "@tabby_ai/hijri-converter";

function templateHijriOpts(template: RecurringTask) {
  return {
    latitude: template.lat ?? 0,
    longitude: template.long ?? 0,
    offset: template.hijriDateOffset ?? 0,
  };
}

/**
 * Pure (no DB calls). Returns epoch millis for every occurrence of
 * a template that falls within [startEpoch, endEpoch].
 * Respects repeatEnd constraints. Hard-capped at 400 iterations.
 */
export function useRecurringOccurance() {
  const getTaskEpoch = useTaskEpoch();
  const { createHijriDate, toHijriDate } = useHijriDate();

  /**
   * Pure. Returns the epoch of the latest occurrence strictly before
   * beforeEpoch, or null if the series hasn't started yet.
   * Looks back at most 60 days to avoid unbounded iteration for old templates.
   */
  function findLatestOccurrenceBefore(
    template: RecurringTask,
    beforeEpoch: number
  ): number | null {
    const lookbackMs = 60 * 24 * 60 * 60 * 1000;
    const lookbackStart = beforeEpoch - lookbackMs;
    const occurrences = computeOccurrencesInRange(
      template,
      lookbackStart,
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
    const opts = templateHijriOpts(template);

    let hour: number | undefined;
    let minutes: number | undefined;
    if (template.atTime) {
      const [h, m] = template.atTime.split(":").map(Number);
      hour = h;
      minutes = m;
    }

    const effectiveEnd =
      template.recurringEnd === "on_date" && template.recurringEndEpoch
        ? Math.min(endEpoch, template.recurringEndEpoch)
        : endEpoch;

    if (template.baseDateEpoch > effectiveEnd) return [];

    const baseHijri = toHijriDate(new Date(template.baseDateEpoch));
    let currentDateStr = formatHijriDateString(
      baseHijri.year,
      baseHijri.month,
      baseHijri.day
    );

    const maxOccurrences =
      template.recurringEnd === "after_occurrences" &&
      template.recurringEndOccurrences
        ? template.recurringEndOccurrences
        : Infinity;

    const results: number[] = [];
    let totalCount = 0;
    let iterations = 0;
    const maxIterations = 400;

    while (iterations < maxIterations && totalCount < maxOccurrences) {
      const { year, month, day } = parseHijriDateString(currentDateStr);
      const greg = hijriToGregorian({ year, month, day });

      const epoch = getTaskEpoch(
        new Date(greg.year, greg.month - 1, greg.day),
        template.atTime as string
      ) as number;

      if (epoch > effectiveEnd) break;

      if (epoch >= startEpoch) {
        results.push(epoch);
      }

      totalCount++;

      const nextStr = getNextOccurrenceDate(
        currentDateStr,
        template.recurringType,
        interval,
        template.lat,
        template.long,
        template.hijriDateOffset,
        hour,
        minutes,
        template.useGregorian
      );
      if (!nextStr) break;
      currentDateStr = nextStr;
      iterations++;
    }

    return results;
  };

  /**
   * Builds ephemeral virtual Task objects for all templates within
   * [startEpoch, endEpoch], skipping dates that already have a real task
   * (edited/completed) or a soft-deleted task (user deleted that occurrence).
   * Also surfaces at most one overdue virtual per template.
   */
  async function buildVirtualTasksForRange(
    templates: RecurringTask[],
    taskRepository: ITaskRepository,
    startEpoch: number,
    endEpoch: number
  ): Promise<Task[]> {
    const all: Task[] = [];

    for (const template of templates) {
      const occurrences = computeOccurrencesInRange(
        template,
        startEpoch,
        endEpoch
      );

      // Fetch all real task docs for this template in range (including soft-deleted)
      const exceptions = await taskRepository.findByRecurringTaskIdInRange(
        template.id,
        startEpoch,
        endEpoch
      );

      const takenEpochs = new Set(
        exceptions.filter((t) => !t.deletedAt).map((t) => t.atEpochMillis)
      );
      const deletedEpochs = new Set(
        exceptions.filter((t) => t.deletedAt).map((t) => t.atEpochMillis)
      );

      for (const epoch of occurrences) {
        if (deletedEpochs.has(epoch)) continue;
        if (takenEpochs.has(epoch)) continue;
        all.push(createVirtualTask(template, epoch));
      }

      // Surface at most one overdue virtual per template
      const overdueEpoch = findLatestOccurrenceBefore(template, startEpoch);
      if (overdueEpoch !== null) {
        const overdueExceptions =
          await taskRepository.findByRecurringTaskIdInRange(
            template.id,
            overdueEpoch - 1,
            overdueEpoch + 1
          );
        const resolved = overdueExceptions.some(
          (t) => t.atEpochMillis === overdueEpoch
        );
        if (!resolved) {
          all.push(createVirtualTask(template, overdueEpoch));
        }
      }
    }

    return all;
  }

  /**
   * Computes the next occurrence Hijri date string (YYYYMMDD) given a current date and repeat type.
   * Returns null if repeat is "none" or inputs are invalid.
   */
  function getNextOccurrenceDate(
    atDateHijri: string,
    recurringType: TaskRecurringType,
    interval = 1,
    lat = 0,
    long = 0,
    offset = 0,
    hour: number | undefined,
    minutes: number | undefined,
    useGregorian = false
  ): string | null {
    if (!recurringType || recurringType === "none" || !atDateHijri) return null;

    const n = Math.max(1, interval);
    const { year, month, day } = parseHijriDateString(atDateHijri);
    const coords = { offset };

    if (recurringType === "daily" || recurringType === "weekly") {
      const days = recurringType === "weekly" ? n * 7 : n;
      const hijriDate = createHijriDate(year, month, day, hour, minutes);
      const greg = hijriDate.toDate();
      greg.setDate(greg.getDate() + days);
      const next = toHijriDate(greg);
      return formatHijriDateString(next.year, next.month, next.day);
    }

    if (recurringType === "monthly") {
      if (useGregorian) {
        const greg = createHijriDate(year, month, day, hour, minutes).toDate();
        greg.setMonth(greg.getMonth() + n);
        const next = toHijriDate(greg);
        return formatHijriDateString(next.year, next.month, next.day);
      }
      const totalMonths = year * 12 + (month - 1) + n;
      const nextYear = Math.floor(totalMonths / 12);
      const nextMonth = (totalMonths % 12) + 1;
      // Cap day at 29 to avoid invalid end-of-month dates (Hijri months are 29–30 days)
      return formatHijriDateString(nextYear, nextMonth, Math.min(day, 29));
    }

    if (recurringType === "yearly") {
      if (useGregorian) {
        const greg = createHijriDate(
          year,
          month,
          day,
          hour,
          minutes,
          0,
          0
        ).toDate();
        greg.setFullYear(greg.getFullYear() + n);
        const next = toHijriDate(greg);
        return formatHijriDateString(next.year, next.month, next.day);
      }
      return formatHijriDateString(year + n, month, day);
    }

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
