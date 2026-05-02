import type { ITrackerRepository } from "../../domain/tracker/ITrackerRepository";
import type {
  Tracker,
  TrackerLog,
  TrackerCreateInput,
  TrackerUpdateInput,
  TrackerLogCreateInput,
  TrackerQuery,
} from "../../domain/tracker/ITrackerRepository";

export interface TrackerStats {
  total: number;
  count: number;
  average: number;
  lastValue: number | null;
  todayTotal: number;
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

  deleteLog(id: string): Promise<void> {
    return this.repository.deleteLog(id);
  }

  getLogs(query?: TrackerQuery): Promise<TrackerLog[]> {
    return this.repository.findLogs(query);
  }

  async getStats(trackerId: string, todayDateHijri?: string): Promise<TrackerStats> {
    const logs = await this.repository.findLogs({ trackerId });
    const values = logs.map((l) => l.value ?? 0);
    const total = values.reduce((s, v) => s + v, 0);
    const count = logs.length;
    const average = count > 0 ? total / count : 0;
    const lastValue = count > 0 ? (logs[0].value ?? null) : null;
    let todayTotal = 0;
    if (todayDateHijri) {
      const todayLogs = logs.filter((l) => l.dateHijri === todayDateHijri);
      todayTotal = todayLogs.reduce((s, l) => s + (l.value ?? 0), 0);
    }
    return { total, count, average, lastValue, todayTotal };
  }
}
