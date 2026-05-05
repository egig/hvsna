import { hijriToGregorian, gregorianToHijri } from "@tabby_ai/hijri-converter";
import type {
  Tracker,
  TrackerLog,
  TrackerEvalStatus,
} from "../../domain/tracker/ITrackerRepository";

export interface EvaluationResult {
  currentScore: number | undefined;
  currentStreak: number | undefined;
  currentStatus: TrackerEvalStatus | undefined;
  lastEvaluatedAt: number;
}

const MS_PER_DAY = 86_400_000;

function hijriToTimestamp(dateHijri: string): number {
  const year = parseInt(dateHijri.substring(0, 4));
  const month = parseInt(dateHijri.substring(4, 6));
  const day = parseInt(dateHijri.substring(6, 8));
  const g = hijriToGregorian({ year, month, day });
  return new Date(g.year, g.month - 1, g.day).getTime();
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

function logTimestamp(log: TrackerLog): number {
  return log.occurredAt ?? log.createdAt ?? 0;
}

export function isDoneLog(log: TrackerLog): boolean {
  return log.valueBool === true || (log.value !== undefined && log.value > 0);
}

function isDoneDayForHabit(
  dayLogs: TrackerLog[],
  condition?: string,
  targetValue?: number,
  targetMin?: number,
  targetMax?: number,
  direction?: string
): boolean {
  if (condition === "threshold" && targetValue && targetValue > 0) {
    const sum = dayLogs.reduce((s, l) => s + (l.value ?? 0), 0);
    return direction === "down" ? sum <= targetValue : sum >= targetValue;
  }
  if (
    condition === "range" &&
    targetMin !== undefined &&
    targetMax !== undefined
  ) {
    return dayLogs.some((l) => {
      const v = l.valueMin ?? l.value ?? 0;
      return v >= targetMin && v <= targetMax;
    });
  }
  return dayLogs.some(isDoneLog);
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

function getPeriodStartTimestamp(
  todayTimestamp: number,
  period: string,
  weekStartDay = 5
): number {
  if (period === "weekly") {
    const d = new Date(todayTimestamp);
    const daysBack = (d.getDay() - weekStartDay + 7) % 7;
    const start = new Date(
      d.getFullYear(),
      d.getMonth(),
      d.getDate() - daysBack
    );
    return start.getTime();
  }
  if (period === "monthly") {
    const d = new Date(todayTimestamp);
    const h = gregorianToHijri({
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      day: d.getDate(),
    });
    const g = hijriToGregorian({ year: h.year, month: h.month, day: 1 });
    return new Date(g.year, g.month - 1, g.day).getTime();
  }
  return todayTimestamp;
}

function getLogsInCurrentPeriod(
  logs: TrackerLog[],
  period: string,
  todayTimestamp: number,
  weekStartDay = 5
): TrackerLog[] {
  const periodStart = getPeriodStartTimestamp(
    todayTimestamp,
    period,
    weekStartDay
  );
  return logs.filter((log) => {
    const ts = logTimestamp(log);
    return ts >= periodStart && ts <= todayTimestamp + MS_PER_DAY - 1;
  });
}

function calcHabitStreak(
  logs: TrackerLog[],
  todayTimestamp: number,
  condition?: string,
  targetValue?: number,
  targetMin?: number,
  targetMax?: number,
  direction?: string
): number {
  const byDate = groupByHijriDate(logs);

  const doneDates = new Set<string>();
  for (const [date, dayLogs] of byDate) {
    if (
      isDoneDayForHabit(
        dayLogs,
        condition,
        targetValue,
        targetMin,
        targetMax,
        direction
      )
    )
      doneDates.add(date);
  }

  if (doneDates.size === 0) return 0;

  const sorted = Array.from(doneDates).sort((a, b) => b.localeCompare(a));

  // Allow the current day to not yet be logged (streak still intact from yesterday)
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

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function scoreToStatus(score: number, isExpired: boolean): TrackerEvalStatus {
  if (isExpired) return score >= 100 ? "achieved" : "failed";
  if (score >= 80) return "on_track";
  if (score >= 50) return "at_risk";
  return "off_track";
}

export function evaluate(
  tracker: Tracker,
  logs: TrackerLog[],
  todayTimestamp: number,
  weekStartDay = 5
): EvaluationResult {
  const now = Date.now();
  const type = tracker.type;

  if (!type || type === "numeric" || type === "binary" || type === "tally") {
    return {
      currentScore: undefined,
      currentStreak: undefined,
      currentStatus: undefined,
      lastEvaluatedAt: now,
    };
  }

  const todayHijri = timestampToHijriStr(todayTimestamp);
  const isExpired = tracker.endDateHijri
    ? todayHijri > tracker.endDateHijri
    : false;
  const period = tracker.period ?? "daily";
  const periodLogs = getLogsInCurrentPeriod(
    logs,
    period,
    todayTimestamp,
    weekStartDay
  );

  let score: number | undefined;
  let streak: number | undefined;

  if (type === "habit") {
    const cond = tracker.condition ?? "binary";
    const dir = tracker.direction ?? "up";
    streak = calcHabitStreak(
      logs,
      todayTimestamp,
      cond,
      tracker.targetValue,
      tracker.targetMin,
      tracker.targetMax,
      dir
    );

    const periodStart = getPeriodStartTimestamp(
      todayTimestamp,
      period,
      weekStartDay
    );
    const daysInPeriod = Math.max(
      1,
      Math.round((todayTimestamp - periodStart) / MS_PER_DAY) + 1
    );

    const periodByDate = groupByHijriDate(periodLogs);
    let doneDays = 0;
    for (const dayLogs of periodByDate.values()) {
      if (
        isDoneDayForHabit(
          dayLogs,
          cond,
          tracker.targetValue,
          tracker.targetMin,
          tracker.targetMax,
          dir
        )
      )
        doneDays++;
    }

    score = clamp(Math.round((doneDays / daysInPeriod) * 100), 0, 100);
  } else if (type === "build_up" || type === "cut_down") {
    const cond = tracker.condition ?? "threshold";
    if (
      cond === "range" &&
      tracker.targetMin !== undefined &&
      tracker.targetMax !== undefined
    ) {
      const total = periodLogs.length;
      if (total > 0) {
        const inRange = periodLogs.filter((l) => {
          const v = l.valueMin ?? l.value ?? 0;
          return v >= tracker.targetMin! && v <= tracker.targetMax!;
        }).length;
        score = clamp(Math.round((inRange / total) * 100), 0, 100);
      } else {
        score = 0;
      }
    } else if (tracker.targetValue && tracker.targetValue > 0) {
      const direction =
        tracker.direction ?? (type === "cut_down" ? "down" : "up");
      const actual =
        tracker.accumulate !== false
          ? periodLogs.reduce((s, l) => s + (l.value ?? 0), 0)
          : periodLogs.length > 0
          ? [...periodLogs].sort((a, b) => logTimestamp(b) - logTimestamp(a))[0]
              .value ?? 0
          : 0;
      score =
        direction === "down"
          ? clamp(Math.round((1 - actual / tracker.targetValue) * 100), 0, 100)
          : clamp(Math.round((actual / tracker.targetValue) * 100), 0, 100);
    }
  }

  const currentStatus =
    score !== undefined ? scoreToStatus(score, isExpired) : undefined;

  return {
    currentScore: score,
    currentStreak: streak,
    currentStatus,
    lastEvaluatedAt: now,
  };
}
