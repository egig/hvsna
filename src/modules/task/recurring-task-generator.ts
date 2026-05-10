import type PouchDB from "pouchdb";
import type { RecurringTask } from "./recurring-task";
import type { ITaskRepository } from "../../domain/task/ITaskRepository";
import { HijriDate } from "../calendar/hijri";
import {
  parseHijriDateString,
  getNextOccurrenceDate,
} from "./task-form-helpers";

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

/**
 * Generates pending Task instances for a single RecurringTask template,
 * up to the horizon, skipping dates that already have an instance.
 */
export async function generateOccurrencesForTemplate(
  template: RecurringTask,
  taskRepository: ITaskRepository,
  todayEpoch: number
): Promise<void> {
  const interval = template.repeatInterval ?? 1;
  const horizon = horizonDays(template.repeat, interval);
  const horizonEpoch = todayEpoch + horizon * 24 * 60 * 60 * 1000;

  // Collect existing instance dates to avoid duplicates
  const existing = await taskRepository.findByRecurringTaskId(template.id);
  const existingDates = new Set(existing.map((t) => t.atDateHijri));

  // "on_date" end epoch
  let endEpoch: number | null = null;
  if (template.repeatEnd === "on_date" && template.repeatEndDate) {
    const { year, month, day } = parseHijriDateString(template.repeatEndDate);
    endEpoch = new HijriDate(
      year,
      month,
      day,
      undefined,
      undefined,
      undefined,
      undefined,
      {
        latitude: template.lat ?? 0,
        longitude: template.long ?? 0,
        offset: template.hijriDateOffset ?? 0,
      }
    )
      .endOfDay()
      .toDate()
      .getTime();
  }

  const maxToCreate =
    template.repeatEnd === "after_occurrences" && template.repeatEndOccurrences
      ? Math.max(0, template.repeatEndOccurrences - existing.length)
      : Infinity;
  let newCount = 0;

  const effectiveHorizon =
    endEpoch !== null ? Math.min(horizonEpoch, endEpoch) : horizonEpoch;

  let currentDateStr = template.baseDateHijri;
  let iterations = 0;
  const maxIterations = 400;

  // Extract hour and minutes from template time if available
  let hour = undefined;
  let minutes = undefined;

  if (template.atTime) {
    const [h, m] = template.atTime.split(":").map(Number);
    hour = h;
    minutes = m;
  }

  while (iterations < maxIterations) {
    const { year, month, day } = parseHijriDateString(currentDateStr);
    let hijriDate = new HijriDate(
      year,
      month,
      day,
      hour,
      minutes,
      undefined,
      undefined,
      {
        // TODO use use hook instead ? lat long is required
        latitude: template.lat ?? 0,
        longitude: template.long ?? 0,
        offset: template.hijriDateOffset ?? 0,
      }
    );

    // of no time set, we use end of day as task date
    if (!template.atTime) {
      hijriDate = hijriDate.endOfDay();
    }
    const dateEpoch = hijriDate.toDate().getTime();

    if (dateEpoch > effectiveHorizon) break;

    if (dateEpoch >= todayEpoch && !existingDates.has(currentDateStr)) {
      if (newCount >= maxToCreate) break;

      await taskRepository.create({
        name: template.name,
        description: template.description,
        atDateHijri: currentDateStr,
        atTime: template.atTime,
        prayerTime: template.prayerTime,
        lat: template.lat,
        long: template.long,
        timezone: template.timezone,
        hijriDateOffset: template.hijriDateOffset,
        repeat: template.repeat,
        repeatInterval: interval,
        recurringTaskId: template.id,
        attributes: template.attributes,
        tags: template.tags || [],
      });
      newCount++;
    }

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
}

/**
 * Loads all RecurringTask templates from PouchDB and generates
 * missing occurrences for each. Safe to call on every app startup.
 */
export async function generateAllRecurringTaskOccurrences(
  db: PouchDB.Database,
  taskRepository: ITaskRepository,
  todayEpoch: number
): Promise<void> {
  const response = await db.allDocs({
    include_docs: true,
    startkey: "rtask_",
    endkey: "rtask_\uffff",
  });

  const templates = response.rows
    .filter((row: any) => row.doc && row.doc.baseDateHijri)
    .map((row: any) => row.doc as RecurringTask);

  await Promise.all(
    templates.map((template) =>
      generateOccurrencesForTemplate(template, taskRepository, todayEpoch)
    )
  );
}
