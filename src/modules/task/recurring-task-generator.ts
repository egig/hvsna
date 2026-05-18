import type PouchDB from "pouchdb";
import type { RecurringTask } from "./recurring-task";
import type { ITaskRepository } from "../../domain/task/ITaskRepository";
import { HijriDate } from "../calendar/hijri";
import {
  parseHijriDateString,
  formatHijriDateString,
  getNextOccurrenceDate,
} from "./task-form-helpers";
import { Task } from "@/domain/task";

// Target occurrences × days-per-unit gives the horizon in days.
// Multiplied by repeatInterval so "every 3 months" still yields ~12 occurrences.
const TARGET_OCCURRENCES: Record<string, number> = {
  daily: 30,
  weekly: 20,
  monthly: 12,
  yearly: 5,
};

const DAYS_PER_UNIT: Record<string, number> = {
  daily: 1,
  weekly: 7,
  monthly: 30,
  yearly: 365,
};

function horizonDays(repeat: string, interval: number): number {
  const target = TARGET_OCCURRENCES[repeat] ?? 30;
  const unit = DAYS_PER_UNIT[repeat] ?? 1;
  return target * interval * unit;
}

function templateHijriOpts(template: RecurringTask) {
  return {
    latitude: template.lat ?? 0,
    longitude: template.long ?? 0,
    offset: template.hijriDateOffset ?? 0,
  };
}

function epochFromHijriStr(
  dateStr: string,
  hour: number | undefined,
  minutes: number | undefined,
  opts: { latitude: number; longitude: number; offset: number }
): number {
  const { year, month, day } = parseHijriDateString(dateStr);
  let hijriDate = new HijriDate(
    year,
    month,
    day,
    hour,
    minutes,
    undefined,
    undefined,
    opts
  );
  if (hour === undefined) {
    hijriDate = hijriDate.endOfDay();
  }
  return hijriDate.toDate().getTime();
}

/**
 * Pure (no DB calls). Returns epoch millis for every occurrence of
 * a template that falls within [startEpoch, endEpoch].
 * Respects repeatEnd constraints. Hard-capped at 400 iterations.
 */
export function computeOccurrencesInRange(
  template: RecurringTask,
  startEpoch: number,
  endEpoch: number
): number[] {
  const interval = template.repeatInterval ?? 1;
  const opts = templateHijriOpts(template);

  let hour: number | undefined;
  let minutes: number | undefined;
  if (template.atTime) {
    const [h, m] = template.atTime.split(":").map(Number);
    hour = h;
    minutes = m;
  }

  const effectiveEnd =
    template.repeatEnd === "on_date" && template.repeatEndEpoch
      ? Math.min(endEpoch, template.repeatEndEpoch)
      : endEpoch;

  if (template.baseDateEpoch > effectiveEnd) return [];

  const baseHijri = HijriDate.fromDate(new Date(template.baseDateEpoch), opts);
  let currentDateStr = formatHijriDateString(
    baseHijri.year,
    baseHijri.month,
    baseHijri.day
  );

  const maxOccurrences =
    template.repeatEnd === "after_occurrences" && template.repeatEndOccurrences
      ? template.repeatEndOccurrences
      : Infinity;

  const results: number[] = [];
  let totalCount = 0;
  let iterations = 0;
  const maxIterations = 400;

  while (iterations < maxIterations && totalCount < maxOccurrences) {
    const epoch = epochFromHijriStr(currentDateStr, hour, minutes, opts);

    if (epoch > effectiveEnd) break;

    if (epoch >= startEpoch) {
      results.push(epoch);
    }

    totalCount++;

    const nextStr = getNextOccurrenceDate(
      currentDateStr,
      template.repeat,
      interval,
      template.lat,
      template.long,
      template.hijriDateOffset,
      hour,
      minutes
    );
    if (!nextStr) break;
    currentDateStr = nextStr;
    iterations++;
  }

  return results;
}

/**
 * Pure. Returns the epoch of the latest occurrence strictly before
 * beforeEpoch, or null if the series hasn't started yet.
 * Looks back at most 60 days to avoid unbounded iteration for old templates.
 */
export function findLatestOccurrenceBefore(
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

function createVirtualTask(template: RecurringTask, epoch: number): Task {
  return new Task({
    id: `vtask_${template.id}_${epoch}`,
    isVirtual: true,
    recurringTaskId: template.id,
    name: template.name,
    description: template.description,
    atEpochMillis: epoch,
    atTime: template.atTime,
    prayerTime: template.prayerTime,
    repeat: template.repeat,
    repeatInterval: template.repeatInterval ?? 1,
    lat: template.lat,
    long: template.long,
    timezone: template.timezone,
    hijriDateOffset: template.hijriDateOffset,
    tags: template.tags ?? [],
    attributes: template.attributes,
    status: 0,
    noDate: 0,
  });
}

/**
 * Builds ephemeral virtual Task objects for all templates within
 * [startEpoch, endEpoch], skipping dates that already have a real task
 * (edited/completed) or a soft-deleted task (user deleted that occurrence).
 * Also surfaces at most one overdue virtual per template.
 */
export async function buildVirtualTasksForRange(
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
