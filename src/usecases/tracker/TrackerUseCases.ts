import { gregorianToHijri } from "@tabby_ai/hijri-converter";
import type { ITrackerRepository } from "../../domain/tracker/ITrackerRepository";
import type {
  Tracker,
  TrackerLog,
  TrackerCreateInput,
  TrackerUpdateInput,
  TrackerLogCreateInput,
  TrackerLogUpdateInput,
  TrackerQuery,
  TrackerEvalStatus,
} from "../../domain/tracker/ITrackerRepository";
import { evaluate } from "./evaluation";

export interface TrackerStats {
  total: number;
  count: number;
  average: number;
  lastValue: number | null;
  todayTotal: number;
  currentScore: number | undefined;
  currentStreak: number | undefined;
  currentStatus: TrackerEvalStatus | undefined;
}

function dayRange(ts: number): [number, number] {
  const d = new Date(ts);
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  return [start, start + 86_399_999];
}

function timestampToHijriStr(ts: number): string {
  const d = new Date(ts);
  const h = gregorianToHijri({ year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() });
  return `${String(h.year).padStart(4, "0")}${String(h.month).padStart(2, "0")}${String(h.day).padStart(2, "0")}`;
}

export class TrackerUseCases {
  constructor(private readonly repository: ITrackerRepository) {}

  createTracker(input: TrackerCreateInput): Promise<Tracker> {
    return this.repository.createTracker(input);
  }

  updateTracker(id: string, input: TrackerUpdateInput): Promise<Tracker> {
    return this.repository.updateTracker(id, input);
  }

  deleteTracker(id: string): Promise<void> {
    return this.repository.deleteTracker(id);
  }

  getTracker(id: string): Promise<Tracker | null> {
    return this.repository.findTrackerById(id);
  }

  getTrackers(): Promise<Tracker[]> {
    return this.repository.findTrackers();
  }

  createLog(input: TrackerLogCreateInput): Promise<TrackerLog> {
    return this.repository.createLog(input);
  }

  updateLog(id: string, input: TrackerLogUpdateInput): Promise<TrackerLog> {
    return this.repository.updateLog(id, input);
  }

  deleteLog(id: string): Promise<void> {
    return this.repository.deleteLog(id);
  }

  getLogs(query?: TrackerQuery): Promise<TrackerLog[]> {
    return this.repository.findLogs(query);
  }

  async getStats(trackerId: string, todayTimestamp?: number): Promise<TrackerStats> {
    const [tracker, logs] = await Promise.all([
      this.repository.findTrackerById(trackerId),
      this.repository.findLogs({ trackerId }),
    ]);

    const values = logs.map((l) => l.value ?? 0);
    const total = values.reduce((s, v) => s + v, 0);
    const count = logs.length;
    const average = count > 0 ? total / count : 0;
    const lastValue = count > 0 ? (logs[0].value ?? null) : null;

    let todayTotal = 0;
    if (todayTimestamp) {
      const [dayStart, dayEnd] = dayRange(todayTimestamp);
      const todayLogs = logs.filter((l) => {
        const ts = l.occurredAt ?? 0;
        return ts >= dayStart && ts <= dayEnd;
      });
      todayTotal = todayLogs.reduce((s, l) => s + (l.value ?? 0), 0);
    }

    let currentScore: number | undefined;
    let currentStreak: number | undefined;
    let currentStatus: TrackerEvalStatus | undefined;
    if (tracker && todayTimestamp) {
      const todayDateHijri = timestampToHijriStr(todayTimestamp);
      const result = evaluate(tracker, logs, todayDateHijri);
      currentScore = result.currentScore;
      currentStreak = result.currentStreak;
      currentStatus = result.currentStatus;
    }

    return { total, count, average, lastValue, todayTotal, currentScore, currentStreak, currentStatus };
  }
}
