// ---------- Input Modes ----------
export type InputMode = "toggle" | "add" | "set";

/** @deprecated Use InputMode */
export type TrackerType = InputMode;

// ---------- Time Window ----------
export type TimeWindow =
  | "today"
  | "7d"
  | "30d"
  | { type: "custom"; from: number; to: number };

// ---------- Comparison ----------
export type Operator = ">=" | "<=" | ">" | "<" | "==";

// ---------- Metrics per Type ----------

// toggle → consistency
export type ToggleMetric =
  | "count"
  | "rate"
  | "streak"
  | "latest"
  | "previous"
  | "gap"
  | "consistency";

// add → volume
export type AddMetric =
  | "sum"
  | "average"
  | "per_day"
  | "count"
  | "latest"
  | "previous"
  | "gap"
  | "min"
  | "max"
  | "trend"
  | "distribution";

// set → state & change
export type SetMetric =
  | "latest"
  | "delta"
  | "trend"
  | "average"
  | "min"
  | "max"
  | "previous"
  | "gap"
  | "distribution";

// ---------- Metric Mapping ----------
export type MetricsByMode = {
  toggle: ToggleMetric;
  add: AddMetric;
  set: SetMetric;
};

// ---------- Evaluation Config ----------
export type EvaluationConfig<T extends InputMode = InputMode> = {
  id: string;

  // which metric to compute
  metric: MetricsByMode[T];

  // time scope
  window: TimeWindow;

  // optional comparison (goal-like, but not required)
  operator?: Operator;
  target?: number;

  // UI hints
  label?: string;
  isPrimary?: boolean;
};

// ---------- Tracker ----------
export class Tracker {
  id?: string;
  name?: string;
  inputMode?: InputMode;
  unit?: string;
  color?: string;
  emoji?: string;
  evaluations?: EvaluationConfig[];
  createdAt?: number;
  updatedAt?: number;

  /** @deprecated Use inputMode */
  get type(): InputMode | undefined {
    return this.inputMode;
  }
  set type(v: InputMode | undefined) {
    this.inputMode = v;
  }
}

export interface TrackerCreateInput {
  name: string;
  inputMode: InputMode;
  unit?: string;
  color?: string;
  emoji?: string;
  evaluations?: EvaluationConfig[];
}

export interface TrackerUpdateInput {
  name?: string;
  inputMode?: InputMode;
  unit?: string;
  color?: string;
  emoji?: string;
  evaluations?: EvaluationConfig[];
}

export class TrackerLog {
  id?: string;
  trackerId?: string;
  value?: number;
  valueBool?: boolean;
  note?: string;
  /** When the event actually occurred (ms epoch). May differ from createdAt for back-dated logs. */
  occurredAt?: number;
  createdAt?: number;
}

export interface TrackerLogCreateInput {
  trackerId: string;
  value?: number;
  valueBool?: boolean;
  note?: string;
  /** When the event occurred (ms epoch). Defaults to now if omitted. */
  occurredAt?: number;
}

export interface TrackerLogUpdateInput {
  value?: number;
  valueBool?: boolean;
  note?: string;
  occurredAt?: number;
}

export interface TrackerQuery {
  trackerId?: string;
}

// ---------- Evaluation Result ----------
export type EvaluationResult = {
  evaluationId: string;
  metric: string;
  value: number;
  target?: number;
  operator?: Operator;
  success?: boolean;
  window: TimeWindow;
};

// ---------- Helper (type-safe creator) ----------
export function createEvaluation<T extends InputMode>(
  _mode: T,
  config: EvaluationConfig<T>
): EvaluationConfig<T> {
  return config;
}


/** @deprecated */
export type TrackerFrequency = "daily" | "weekly" | "monthly";
/** @deprecated */
export type TrackerCondition = "count" | "build_up" | "cut_down" | "range";
/** @deprecated */
export type TrackerEvalStatus =
  | "on_track"
  | "at_risk"
  | "off_track"
  | "achieved"
  | "failed";

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
