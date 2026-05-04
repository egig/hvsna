export type TrackerType =
  | "numeric"
  | "binary"
  | "tally"
  | "habit"
  | "build_up"
  | "cut_down"
  | "target"
  | "range";

export type TrackerFrequency = "daily" | "weekly" | "monthly";

export type TrackerEvalStatus = "on_track" | "at_risk" | "off_track" | "achieved" | "failed";

export class Tracker {
  id?: string;
  name?: string;
  type?: TrackerType;
  unit?: string;
  color?: string;
  emoji?: string;
  createdAt?: number;
  updatedAt?: number;

  // goal fields (new, optional — absent on old documents)
  frequency?: TrackerFrequency;
  targetValue?: number;
  targetMin?: number;
  targetMax?: number;
  startDateHijri?: string;
  endDateHijri?: string;
}

export interface TrackerCreateInput {
  name: string;
  type: TrackerType;
  unit?: string;
  color?: string;
  emoji?: string;
  frequency?: TrackerFrequency;
  targetValue?: number;
  targetMin?: number;
  targetMax?: number;
  startDateHijri?: string;
  endDateHijri?: string;
}

export interface TrackerUpdateInput {
  name?: string;
  type?: TrackerType;
  unit?: string;
  color?: string;
  emoji?: string;
  frequency?: TrackerFrequency;
  targetValue?: number;
  targetMin?: number;
  targetMax?: number;
  startDateHijri?: string;
  endDateHijri?: string;
}

export class TrackerLog {
  id?: string;
  trackerId?: string;
  value?: number;
  valueBool?: boolean;
  valueMin?: number;
  valueMax?: number;
  note?: string;
  /** When the event actually occurred (ms epoch). May differ from createdAt for back-dated logs. */
  occurredAt?: number;
  createdAt?: number;
}

export interface TrackerLogCreateInput {
  trackerId: string;
  value?: number;
  valueBool?: boolean;
  valueMin?: number;
  valueMax?: number;
  note?: string;
  /** When the event occurred (ms epoch). Defaults to now if omitted. */
  occurredAt?: number;
}

export interface TrackerLogUpdateInput {
  value?: number;
  valueBool?: boolean;
  valueMin?: number;
  valueMax?: number;
  note?: string;
  occurredAt?: number;
}

export interface TrackerQuery {
  trackerId?: string;
}

export interface ITrackerRepository {
  createTracker(input: TrackerCreateInput): Promise<Tracker>;
  updateTracker(id: string, input: TrackerUpdateInput): Promise<Tracker>;
  deleteTracker(id: string): Promise<void>;
  findTrackerById(id: string): Promise<Tracker | null>;
  findTrackers(): Promise<Tracker[]>;
  createLog(input: TrackerLogCreateInput): Promise<TrackerLog>;
  updateLog(id: string, input: TrackerLogUpdateInput): Promise<TrackerLog>;
  deleteLog(id: string): Promise<void>;
  findLogs(query?: TrackerQuery): Promise<TrackerLog[]>;
}
