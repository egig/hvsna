import { hijriToGregorian, gregorianToHijri } from "@tabby_ai/hijri-converter";
import type {
  TrackerLog,
  EvaluationConfig,
  EvaluationResult,
  TimeWindow,
  Operator,
} from "../../domain/tracker/ITrackerRepository";

export type { EvaluationResult };

const MS_PER_DAY = 86_400_000;

function logTimestamp(log: TrackerLog): number {
  return log.occurredAt ?? log.createdAt ?? 0;
}

function startOfDay(ts: number): number {
  const d = new Date(ts);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function timestampToHijriStr(ts: number): string {
  const d = new Date(ts);
  const h = gregorianToHijri({
    year: d.getFullYear(),
    month: d.getMonth() + 1,
    day: d.getDate(),
  });
  return `${String(h.year).padStart(4, "0")}${String(h.month).padStart(
    2,
    "0"
  )}${String(h.day).padStart(2, "0")}`;
}

function hijriToTimestamp(dateHijri: string): number {
  const year = parseInt(dateHijri.substring(0, 4));
  const month = parseInt(dateHijri.substring(4, 6));
  const day = parseInt(dateHijri.substring(6, 8));
  const g = hijriToGregorian({ year, month, day });
  return new Date(g.year, g.month - 1, g.day).getTime();
}

export function isDoneLog(log: TrackerLog): boolean {
  return log.valueBool === true || (log.value !== undefined && log.value > 0);
}

function groupByHijriDate(logs: TrackerLog[]): Map<string, TrackerLog[]> {
  const map = new Map<string, TrackerLog[]>();
  for (const log of logs) {
    const key = timestampToHijriStr(logTimestamp(log));
    const group = map.get(key);
    if (group) group.push(log);
    else map.set(key, [log]);
  }
  return map;
}

function getWindowBounds(
  window: TimeWindow,
  todayTimestamp: number
): { from: number; to: number } {
  const dayStart = startOfDay(todayTimestamp);
  if (window === "today") {
    return { from: dayStart, to: dayStart + MS_PER_DAY - 1 };
  }
  if (window === "7d") {
    return { from: dayStart - 6 * MS_PER_DAY, to: dayStart + MS_PER_DAY - 1 };
  }
  if (window === "30d") {
    return { from: dayStart - 29 * MS_PER_DAY, to: dayStart + MS_PER_DAY - 1 };
  }
  return { from: window.from, to: window.to };
}

function filterLogsByWindow(
  logs: TrackerLog[],
  window: TimeWindow,
  todayTimestamp: number
): TrackerLog[] {
  const bounds = getWindowBounds(window, todayTimestamp);
  return logs.filter((log) => {
    const ts = logTimestamp(log);
    return ts >= bounds.from && ts <= bounds.to;
  });
}

function compareResult(
  value: number,
  operator: Operator,
  target: number
): boolean {
  switch (operator) {
    case ">=":
      return value >= target;
    case "<=":
      return value <= target;
    case ">":
      return value > target;
    case "<":
      return value < target;
    case "==":
      return value === target;
  }
}

// ---- Metric calculators ----

function calcCount(logs: TrackerLog[]): number {
  return logs.length;
}

function calcSum(logs: TrackerLog[]): number {
  return logs.reduce((s, l) => s + (l.value ?? 0), 0);
}

function calcAverage(logs: TrackerLog[]): number {
  if (logs.length === 0) return 0;
  return calcSum(logs) / logs.length;
}

function calcLatest(logs: TrackerLog[]): number {
  if (logs.length === 0) return 0;
  const sorted = [...logs].sort((a, b) => logTimestamp(b) - logTimestamp(a));
  return sorted[0].value ?? 0;
}

function calcPrevious(logs: TrackerLog[]): number {
  if (logs.length < 2) return 0;
  const sorted = [...logs].sort((a, b) => logTimestamp(b) - logTimestamp(a));
  return sorted[1].value ?? 0;
}

function calcMin(logs: TrackerLog[]): number {
  if (logs.length === 0) return 0;
  return Math.min(...logs.map((l) => l.value ?? 0));
}

function calcMax(logs: TrackerLog[]): number {
  if (logs.length === 0) return 0;
  return Math.max(...logs.map((l) => l.value ?? 0));
}

function calcGap(logs: TrackerLog[], todayTimestamp: number): number {
  if (logs.length === 0) return Infinity;
  const sorted = [...logs].sort((a, b) => logTimestamp(b) - logTimestamp(a));
  const last = logTimestamp(sorted[0]);
  const diff = startOfDay(todayTimestamp) - startOfDay(last);
  return Math.round(diff / MS_PER_DAY);
}

function calcStreak(
  logs: TrackerLog[],
  todayTimestamp: number,
  isDoneFn: (log: TrackerLog) => boolean = isDoneLog
): number {
  const byDate = groupByHijriDate(logs);
  const doneDates = new Set<string>();
  for (const [date, dayLogs] of byDate) {
    if (dayLogs.some(isDoneFn)) doneDates.add(date);
  }
  if (doneDates.size === 0) return 0;

  const sorted = Array.from(doneDates).sort((a, b) => b.localeCompare(a));
  let current = timestampToHijriStr(todayTimestamp);

  if (!doneDates.has(current) && sorted[0]) {
    const diff = Math.round(
      (hijriToTimestamp(current) - hijriToTimestamp(sorted[0])) / MS_PER_DAY
    );
    if (diff > 1) return 0;
    current = sorted[0];
  }

  let streak = 0;
  for (const date of sorted) {
    if (date !== current) break;
    streak++;
    const prevTs = hijriToTimestamp(current) - MS_PER_DAY;
    const prevStr = timestampToHijriStr(prevTs);
    if (!doneDates.has(prevStr)) break;
    current = prevStr;
  }
  return streak;
}

function calcRate(
  logs: TrackerLog[],
  window: TimeWindow,
  todayTimestamp: number
): number {
  const bounds = getWindowBounds(window, todayTimestamp);
  const daysInWindow = Math.max(
    1,
    Math.ceil((bounds.to - bounds.from + 1) / MS_PER_DAY)
  );
  const byDate = groupByHijriDate(logs);
  const doneDays = Array.from(byDate.values()).filter((dayLogs) =>
    dayLogs.some(isDoneLog)
  ).length;
  return doneDays / daysInWindow;
}

function calcConsistency(
  logs: TrackerLog[],
  window: TimeWindow,
  todayTimestamp: number
): number {
  return calcRate(logs, window, todayTimestamp) * 100;
}

function calcPerDay(
  logs: TrackerLog[],
  window: TimeWindow,
  todayTimestamp: number
): number {
  const bounds = getWindowBounds(window, todayTimestamp);
  const daysInWindow = Math.max(
    1,
    Math.ceil((bounds.to - bounds.from + 1) / MS_PER_DAY)
  );
  return calcSum(logs) / daysInWindow;
}

function calcDelta(logs: TrackerLog[]): number {
  if (logs.length < 2) return 0;
  const sorted = [...logs].sort((a, b) => logTimestamp(b) - logTimestamp(a));
  return (sorted[0].value ?? 0) - (sorted[1].value ?? 0);
}

function calcTrend(logs: TrackerLog[]): number {
  if (logs.length < 2) return 0;
  const prev = calcPrevious(logs);
  if (prev === 0) return 0;
  return (calcLatest(logs) - prev) / prev;
}

function calcDistribution(logs: TrackerLog[]): number {
  // Placeholder: return average as a representative value
  return calcAverage(logs);
}

// ---- Main evaluate function ----

export function evaluate(
  evaluation: EvaluationConfig,
  logs: TrackerLog[],
  todayTimestamp: number
): EvaluationResult {
  const filtered = filterLogsByWindow(logs, evaluation.window, todayTimestamp);

  let value = 0;

  switch (evaluation.metric) {
    // Toggle metrics
    case "count":
      value = calcCount(filtered);
      break;
    case "rate":
      value = calcRate(filtered, evaluation.window, todayTimestamp);
      break;
    case "streak":
      value = calcStreak(filtered, todayTimestamp);
      break;
    case "latest":
      value = calcLatest(filtered);
      break;
    case "previous":
      value = calcPrevious(filtered);
      break;
    case "gap":
      value = calcGap(filtered, todayTimestamp);
      break;
    case "consistency":
      value = calcConsistency(filtered, evaluation.window, todayTimestamp);
      break;

    // Add metrics
    case "sum":
      value = calcSum(filtered);
      break;
    case "average":
      value = calcAverage(filtered);
      break;
    case "per_day":
      value = calcPerDay(filtered, evaluation.window, todayTimestamp);
      break;
    case "min":
      value = calcMin(filtered);
      break;
    case "max":
      value = calcMax(filtered);
      break;
    case "trend":
      value = calcTrend(filtered);
      break;
    case "distribution":
      value = calcDistribution(filtered);
      break;

    // Set metrics
    case "delta":
      value = calcDelta(filtered);
      break;

    default:
      value = 0;
  }

  value = Math.round(value * 1000) / 1000;

  let success: boolean | undefined;
  if (evaluation.operator !== undefined && evaluation.target !== undefined) {
    success = compareResult(value, evaluation.operator, evaluation.target);
  }

  return {
    evaluationId: evaluation.id,
    metric: evaluation.metric,
    value,
    target: evaluation.target,
    operator: evaluation.operator,
    success,
    window: evaluation.window,
  };
}
