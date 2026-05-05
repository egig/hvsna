import { hijriToGregorian, gregorianToHijri } from "@tabby_ai/hijri-converter";
import type { Tracker, TrackerLog, TrackerEvalStatus } from "../../domain/tracker/ITrackerRepository";

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
  const h = gregorianToHijri({ year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() });
  return `${String(h.year).padStart(4, "0")}${String(h.month).padStart(2, "0")}${String(h.day).padStart(2, "0")}`;
}

function logTimestamp(log: TrackerLog): number {
  return log.occurredAt ?? log.createdAt ?? 0;
}

function getPeriodStartTimestamp(todayTimestamp: number, frequency: string, weekStartDay = 5): number {
  if (frequency === "weekly") {
    const d = new Date(todayTimestamp);
    const daysBack = (d.getDay() - weekStartDay + 7) % 7;
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate() - daysBack);
    return start.getTime();
  }
  if (frequency === "monthly") {
    const d = new Date(todayTimestamp);
    const h = gregorianToHijri({ year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() });
    const g = hijriToGregorian({ year: h.year, month: h.month, day: 1 });
    return new Date(g.year, g.month - 1, g.day).getTime();
  }
  return todayTimestamp;
}

function getLogsInCurrentPeriod(logs: TrackerLog[], frequency: string, todayTimestamp: number, weekStartDay = 5): TrackerLog[] {
  const periodStart = getPeriodStartTimestamp(todayTimestamp, frequency, weekStartDay);
  return logs.filter((log) => {
    const ts = logTimestamp(log);
    return ts >= periodStart && ts <= todayTimestamp + MS_PER_DAY - 1;
  });
}

function calcHabitStreak(logs: TrackerLog[], todayTimestamp: number): number {
  // Collect unique Hijri date strings where a "done" log exists
  const doneDates = new Set<string>();
  for (const l of logs) {
    if (l.valueBool === true || (l.value !== undefined && l.value > 0)) {
      const ts = logTimestamp(l);
      if (ts > 0) doneDates.add(timestampToHijriStr(ts));
    }
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
    return { currentScore: undefined, currentStreak: undefined, currentStatus: undefined, lastEvaluatedAt: now };
  }

  const todayHijri = timestampToHijriStr(todayTimestamp);
  const isExpired = tracker.endDateHijri ? todayHijri > tracker.endDateHijri : false;
  const frequency = tracker.frequency ?? "daily";
  const periodLogs = getLogsInCurrentPeriod(logs, frequency, todayTimestamp, weekStartDay);

  let score: number | undefined;
  let streak: number | undefined;

  if (type === "habit") {
    streak = calcHabitStreak(logs, todayTimestamp);

    const periodStart = getPeriodStartTimestamp(todayTimestamp, frequency, weekStartDay);
    const daysInPeriod = Math.max(1, Math.round((todayTimestamp - periodStart) / MS_PER_DAY) + 1);

    const doneDays = new Set(
      periodLogs
        .filter((l) => l.valueBool === true || (l.value !== undefined && l.value > 0))
        .map((l) => timestampToHijriStr(logTimestamp(l)))
    ).size;

    score = clamp(Math.round((doneDays / daysInPeriod) * 100), 0, 100);
  } else if (type === "build_up") {
    if (tracker.targetValue && tracker.targetValue > 0) {
      const actual = periodLogs.reduce((s, l) => s + (l.value ?? 0), 0);
      score = clamp(Math.round((actual / tracker.targetValue) * 100), 0, 100);
    }
  } else if (type === "cut_down") {
    if (tracker.targetValue && tracker.targetValue > 0) {
      const actual = periodLogs.reduce((s, l) => s + (l.value ?? 0), 0);
      score = clamp(Math.round((1 - actual / tracker.targetValue) * 100), 0, 100);
    }
  } else if (type === "target") {
    if (tracker.targetValue && tracker.targetValue > 0) {
      const sorted = [...logs].sort((a, b) => logTimestamp(b) - logTimestamp(a));
      const actual = sorted.length > 0 ? (sorted[0].value ?? 0) : 0;
      score = clamp(Math.round((actual / tracker.targetValue) * 100), 0, 100);
    }
  } else if (type === "range") {
    if (tracker.targetMin !== undefined && tracker.targetMax !== undefined) {
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
    }
  }

  const currentStatus = score !== undefined ? scoreToStatus(score, isExpired) : undefined;

  return { currentScore: score, currentStreak: streak, currentStatus, lastEvaluatedAt: now };
}
