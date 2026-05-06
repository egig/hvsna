import type { ITrackerRepository } from "../../domain/tracker/ITrackerRepository";
import type {
  Tracker,
  TrackerLog,
  TrackerCreateInput,
  TrackerUpdateInput,
  TrackerLogCreateInput,
  TrackerLogUpdateInput,
  TrackerQuery,
  EvaluationConfig,
  EvaluationResult,
} from "../../domain/tracker/ITrackerRepository";
import { evaluate } from "./evaluation";

export interface TrackerStats {
  total: number;
  count: number;
  average: number;
  lastValue: number | null;
  previousValue: number | null;
  todayTotal: number;
  todayDone: boolean;
  streak: number;
}

function dayRange(ts: number): [number, number] {
  const d = new Date(ts);
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  return [start, start + 86_399_999];
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

  async getEvaluationResult(
    trackerId: string,
    evaluationId: string,
    todayTimestamp?: number
  ): Promise<EvaluationResult> {
    const tracker = await this.repository.findTrackerById(trackerId);
    const evaluation = tracker?.evaluations?.find((e) => e.id === evaluationId);
    if (!evaluation) {
      return {
        evaluationId: evaluationId,
        metric: "unknown",
        value: 0,
        window: "today",
      };
    }
    const logs = await this.repository.findLogs({ trackerId });
    return evaluate(evaluation, logs, todayTimestamp ?? Date.now());
  }

  async getStats(
    trackerId: string,
    todayTimestamp?: number
  ): Promise<TrackerStats> {
    const logs = await this.repository.findLogs({ trackerId });

    const byOccurred = [...logs].sort(
      (a, b) =>
        (b.occurredAt ?? b.createdAt ?? 0) - (a.occurredAt ?? a.createdAt ?? 0)
    );
    const values = logs.map((l) => l.value ?? 0);
    const total = values.reduce((s, v) => s + v, 0);
    const count = logs.length;
    const average = count > 0 ? total / count : 0;
    const lastValue =
      byOccurred.length > 0 ? byOccurred[0].value ?? null : null;
    const previousValue =
      byOccurred.length > 1 ? byOccurred[1].value ?? null : null;

    let todayTotal = 0;
    let todayDone = false;
    if (todayTimestamp) {
      const [dayStart, dayEnd] = dayRange(todayTimestamp);
      const todayLogs = logs.filter((l) => {
        const ts = l.occurredAt ?? 0;
        return ts >= dayStart && ts <= dayEnd;
      });
      todayTotal = todayLogs.reduce((s, l) => s + (l.value ?? 0), 0);
      todayDone = todayLogs.some((l) => l.valueBool === true) || todayTotal > 0;
    }

    // Calculate streak - consecutive days with logs
    let streak = 0;
    if (todayTimestamp && count > 0) {
      const MS_PER_DAY = 86_400_000;
      const logDates = new Set<number>();
      logs.forEach((l) => {
        const ts = l.occurredAt ?? l.createdAt ?? 0;
        const dayStart = Math.floor(ts / MS_PER_DAY) * MS_PER_DAY;
        logDates.add(dayStart);
      });

      const sortedDates = Array.from(logDates).sort((a, b) => b - a);
      const todayDayStart =
        Math.floor(todayTimestamp / MS_PER_DAY) * MS_PER_DAY;

      // Allow current day to not yet be logged (streak intact from yesterday)
      let currentDay = todayDayStart;
      if (!logDates.has(todayDayStart) && sortedDates.length > 0) {
        const diff = (todayDayStart - sortedDates[0]) / MS_PER_DAY;
        if (diff > 1) {
          streak = 0;
        } else {
          currentDay = sortedDates[0];
        }
      }

      // Count consecutive days
      streak = 0;
      for (const date of sortedDates) {
        if (date === currentDay) {
          streak++;
          currentDay -= MS_PER_DAY;
        } else {
          break;
        }
      }
    }

    return {
      total,
      count,
      average,
      lastValue,
      previousValue,
      todayTotal,
      todayDone,
      streak,
    };
  }
}
