import type {
  TrackerLog,
  TrackerLogCreateInput,
  TrackerLogUpdateInput,
  TrackerLogQuery,
} from "./TrackerLog";

export interface ITrackerLogRepository {
  create(input: TrackerLogCreateInput): Promise<TrackerLog>;
  update(id: string, input: TrackerLogUpdateInput): Promise<TrackerLog>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<TrackerLog | null>;
  find(query?: TrackerLogQuery): Promise<TrackerLog[]>;
  findByTrackerId(trackerId: string): Promise<TrackerLog[]>;
  findByTimestampRange(
    trackerId: string,
    startTime: number,
    endTime: number
  ): Promise<TrackerLog[]>;
  getLatestLog(trackerId: string): Promise<TrackerLog | null>;
  getLogCount(trackerId: string): Promise<number>;
  getSumByPeriod(
    trackerId: string,
    startTime: number,
    endTime: number
  ): Promise<number>;
  getAverageByPeriod(
    trackerId: string,
    startTime: number,
    endTime: number
  ): Promise<number>;
}
