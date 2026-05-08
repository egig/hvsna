import type { ITrackerRepository } from "../../domain/tracker/ITrackerRepository";
import type { ITrackerLogRepository } from "../../domain/tracker/ITrackerLogRepository";
import type { Tracker, TrackerCreateInput, TrackerUpdateInput } from "../../domain/tracker/Tracker";
import type { TrackerLog } from "../../domain/tracker/TrackerLog";
import { TrackerNotFoundError } from "../../domain/tracker/TrackerErrors";

export interface TrackerProgress {
  currentValue: number;
  targetValue: number | null;
  percentage: number | null;
  isComplete: boolean;
}

export interface TrackerStats {
  count: number;
  sum: number;
  average: number;
}

export class TrackerUseCases {
  constructor(
    private readonly trackerRepository: ITrackerRepository,
    private readonly trackerLogRepository: ITrackerLogRepository
  ) {}

  async createTracker(input: TrackerCreateInput): Promise<Tracker> {
    return await this.trackerRepository.create(input);
  }

  async updateTracker(id: string, input: TrackerUpdateInput): Promise<Tracker> {
    return await this.trackerRepository.update(id, input);
  }

  async deleteTracker(id: string): Promise<void> {
    // Delete all logs associated with this tracker
    const logs = await this.trackerLogRepository.findByTrackerId(id);
    await Promise.all(logs.map((log) => this.trackerLogRepository.delete(log.id)));

    // Delete the tracker
    await this.trackerRepository.delete(id);
  }

  async getTracker(id: string): Promise<Tracker | null> {
    return await this.trackerRepository.findById(id);
  }

  async getTrackers(): Promise<Tracker[]> {
    return await this.trackerRepository.findTrackers();
  }

  async logValue(
    trackerId: string,
    value: number,
    note?: string,
    occurredAt?: number
  ): Promise<TrackerLog> {
    const tracker = await this.trackerRepository.findById(trackerId);
    if (!tracker) {
      throw new TrackerNotFoundError(trackerId);
    }

    return await this.trackerLogRepository.create({
      trackerId,
      value,
      note,
      occurredAt,
    });
  }

  async getTrackerProgress(
    trackerId: string,
    period: "day" | "week" | "month"
  ): Promise<TrackerProgress> {
    const tracker = await this.trackerRepository.findById(trackerId);
    if (!tracker) {
      throw new TrackerNotFoundError(trackerId);
    }

    const { startTime, endTime } = this.getPeriodTimestamps(period);
    const logs = await this.trackerLogRepository.findByTimestampRange(
      trackerId,
      startTime,
      endTime
    );

    const targetValue = tracker.target ? parseFloat(tracker.target) : null;
    let currentValue = 0;

    switch (tracker.inputMode) {
      case "toggle":
        currentValue = logs.length;
        break;
      case "add":
        currentValue = logs.reduce((sum, log) => sum + log.value, 0);
        break;
      case "set":
        currentValue = logs.length > 0 ? logs[0].value : 0;
        break;
    }

    const percentage =
      targetValue !== null && targetValue > 0
        ? (currentValue / targetValue) * 100
        : null;
    const isComplete =
      targetValue !== null ? currentValue >= targetValue : false;

    return {
      currentValue,
      targetValue,
      percentage,
      isComplete,
    };
  }

  async getTrackerStats(
    trackerId: string,
    period: "day" | "week" | "month"
  ): Promise<TrackerStats> {
    const { startTime, endTime } = this.getPeriodTimestamps(period);
    const logs = await this.trackerLogRepository.findByTimestampRange(
      trackerId,
      startTime,
      endTime
    );

    const count = logs.length;
    const sum = logs.reduce((sum, log) => sum + log.value, 0);
    const average = count > 0 ? sum / count : 0;

    return {
      count,
      sum,
      average,
    };
  }

  async getRecentLogs(trackerId: string, limit: number = 10): Promise<TrackerLog[]> {
    const logs = await this.trackerLogRepository.findByTrackerId(trackerId);
    return logs.slice(0, limit);
  }

  async getLatestLog(trackerId: string): Promise<TrackerLog | null> {
    return await this.trackerLogRepository.getLatestLog(trackerId);
  }

  private getPeriodTimestamps(period: "day" | "week" | "month"): {
    startTime: number;
    endTime: number;
  } {
    const now = Date.now();
    const msPerDay = 24 * 60 * 60 * 1000;

    let startTime: number;
    let endTime: number;

    switch (period) {
      case "day":
        // Start of today (midnight)
        startTime = new Date().setHours(0, 0, 0, 0);
        // End of today (end of day)
        endTime = new Date().setHours(23, 59, 59, 999);
        break;
      case "week":
        // Start of week (7 days ago)
        startTime = now - 7 * msPerDay;
        // End of week (now)
        endTime = now;
        break;
      case "month":
        // Start of month (30 days ago)
        startTime = now - 30 * msPerDay;
        // End of month (now)
        endTime = now;
        break;
      default:
        startTime = now;
        endTime = now;
    }

    return { startTime, endTime };
  }
}
