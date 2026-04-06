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
  todayEpoch: number,
): Promise<void> {
  const interval = template.repeatInterval ?? 1;
  const horizon = horizonDays(template.repeat, interval);
  const horizonEpoch = todayEpoch + horizon * 24 * 60 * 60 * 1000;

  // Collect existing instance dates to avoid duplicates
  const existing = await taskRepository.findByRecurringTaskId(template.id);
  const existingDates = new Set(existing.map((t) => t.atDateHijri));

  let currentDateStr = template.baseDateHijri;
  let iterations = 0;
  const maxIterations = 400; // safety cap

  while (iterations < maxIterations) {
    const { year, month, day } = parseHijriDateString(currentDateStr);
    const hijriDate = new HijriDate(year, month, day, 0, 0, 0, 0, {
      latitude: template.lat ?? 0,
      longitude: template.long ?? 0,
      offset: template.hijriDateOffset ?? 0,
    });
    const dateEpoch = hijriDate.toDate().getTime();

    if (dateEpoch > horizonEpoch) break;

    if (dateEpoch >= todayEpoch && !existingDates.has(currentDateStr)) {
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
        listId: template.listId,
      });
    }

    const nextStr = getNextOccurrenceDate(
      currentDateStr,
      template.repeat,
      interval,
      template.lat,
      template.long,
      template.hijriDateOffset,
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
  todayEpoch: number,
): Promise<void> {
  const response = await db.allDocs({
    include_docs: true,
    startkey: "recurring_task_",
    endkey: "recurring_task_\uffff",
  });

  const templates = response.rows
    .filter((row: any) => row.doc && row.doc.baseDateHijri)
    .map((row: any) => row.doc as RecurringTask);

  await Promise.all(
    templates.map((template) =>
      generateOccurrencesForTemplate(template, taskRepository, todayEpoch),
    ),
  );
}
