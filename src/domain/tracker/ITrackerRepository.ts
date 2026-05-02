export type TrackerType = "numeric" | "binary" | "tally";

export class Tracker {
  id?: string;
  name?: string;
  type?: TrackerType;
  unit?: string;
  color?: string;
  emoji?: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface TrackerCreateInput {
  name: string;
  type: TrackerType;
  unit?: string;
  color?: string;
  emoji?: string;
}

export interface TrackerUpdateInput {
  name?: string;
  type?: TrackerType;
  unit?: string;
  color?: string;
  emoji?: string;
}

export class TrackerLog {
  id?: string;
  trackerId?: string;
  value?: number;
  note?: string;
  dateHijri?: string;
  createdAt?: number;
}

export interface TrackerLogCreateInput {
  trackerId: string;
  value: number;
  note?: string;
  dateHijri: string;
}

export interface TrackerQuery {
  trackerId?: string;
  dateHijri?: string;
}

export interface ITrackerRepository {
  createTracker(input: TrackerCreateInput): Promise<Tracker>;
  updateTracker(id: string, input: TrackerUpdateInput): Promise<Tracker>;
  deleteTracker(id: string): Promise<void>;
  findTrackerById(id: string): Promise<Tracker | null>;
  findTrackers(): Promise<Tracker[]>;
  createLog(input: TrackerLogCreateInput): Promise<TrackerLog>;
  deleteLog(id: string): Promise<void>;
  findLogs(query?: TrackerQuery): Promise<TrackerLog[]>;
}
