import { describe, it, expect } from "vitest";
import { evaluate } from "../evaluation";
import type { Tracker, TrackerLog } from "../../../domain/tracker/ITrackerRepository";

const DAY = 86_400_000;

// May 5, 2026 (Monday) — stable anchor for all tests
const TODAY = new Date(2026, 4, 5).getTime();

function daysAgo(n: number): number {
  return TODAY - n * DAY;
}

function makeTracker(overrides: Partial<Tracker> = {}): Tracker {
  return { id: "t1", name: "Test", ...overrides } as Tracker;
}

function makeLog(occurredAt: number, overrides: Partial<TrackerLog> = {}): TrackerLog {
  return { id: "l", trackerId: "t1", occurredAt, ...overrides } as TrackerLog;
}

// ── Legacy types ────────────────────────────────────────────────────────────

describe("legacy types", () => {
  it.each(["numeric", "binary", "tally"] as const)(
    "%s returns undefined scores",
    (type) => {
      const result = evaluate(makeTracker({ type }), [], TODAY);
      expect(result.currentScore).toBeUndefined();
      expect(result.currentStreak).toBeUndefined();
      expect(result.currentStatus).toBeUndefined();
    }
  );
});

// ── habit ───────────────────────────────────────────────────────────────────

describe("habit — daily", () => {
  const tracker = makeTracker({ type: "habit", frequency: "daily" });

  it("scores 100 when logged today", () => {
    const logs = [makeLog(TODAY, { valueBool: true })];
    const { currentScore, currentStreak } = evaluate(tracker, logs, TODAY);
    expect(currentScore).toBe(100);
    expect(currentStreak).toBe(1);
  });

  it("scores 0 when not logged today but counts streak from yesterday", () => {
    const logs = [makeLog(daysAgo(1), { valueBool: true })];
    const { currentScore, currentStreak } = evaluate(tracker, logs, TODAY);
    expect(currentScore).toBe(0);
    expect(currentStreak).toBe(1);
  });

  it("streak breaks when there is a gap", () => {
    const logs = [
      makeLog(daysAgo(3), { valueBool: true }),
      makeLog(daysAgo(1), { valueBool: true }),
    ];
    const { currentStreak } = evaluate(tracker, logs, TODAY);
    expect(currentStreak).toBe(1);
  });

  it("counts consecutive-day streak", () => {
    const logs = [
      makeLog(TODAY, { valueBool: true }),
      makeLog(daysAgo(1), { valueBool: true }),
      makeLog(daysAgo(2), { valueBool: true }),
    ];
    const { currentStreak } = evaluate(tracker, logs, TODAY);
    expect(currentStreak).toBe(3);
  });

  it("returns 0 streak when no done logs", () => {
    const logs = [makeLog(TODAY, { valueBool: false })];
    const { currentStreak } = evaluate(tracker, logs, TODAY);
    expect(currentStreak).toBe(0);
  });
});

describe("habit — weekly (weekStartDay=5/Friday)", () => {
  // TODAY = May 5 (Tuesday), weekStartDay=5 → week started May 1 (Friday) → 5 days in period
  const tracker = makeTracker({ type: "habit", frequency: "weekly" });

  it("scores 100 when all 5 days of the week are logged", () => {
    const logs = [0, 1, 2, 3, 4].map((n) => makeLog(daysAgo(n), { valueBool: true }));
    const { currentScore } = evaluate(tracker, logs, TODAY, 5);
    expect(currentScore).toBe(100);
  });

  it("scores 20 when 1 of 5 days is logged", () => {
    const logs = [makeLog(TODAY, { valueBool: true })];
    const { currentScore } = evaluate(tracker, logs, TODAY, 5);
    expect(currentScore).toBe(20);
  });

  it("excludes logs from before the week start", () => {
    const logs = [makeLog(daysAgo(5), { valueBool: true })]; // April 30, before May 1 Friday start
    const { currentScore } = evaluate(tracker, logs, TODAY, 5);
    expect(currentScore).toBe(0);
  });
});

// ── build_up ─────────────────────────────────────────────────────────────────

describe("build_up", () => {
  const tracker = makeTracker({ type: "build_up", frequency: "daily", targetValue: 100 });

  it("scores proportional to sum vs target", () => {
    const logs = [makeLog(TODAY, { value: 60 })];
    const { currentScore, currentStatus } = evaluate(tracker, logs, TODAY);
    expect(currentScore).toBe(60);
    expect(currentStatus).toBe("at_risk");
  });

  it("clamps to 100 when sum exceeds target", () => {
    const logs = [makeLog(TODAY, { value: 150 })];
    const { currentScore } = evaluate(tracker, logs, TODAY);
    expect(currentScore).toBe(100);
  });

  it("scores 0 with no logs", () => {
    const { currentScore } = evaluate(tracker, [], TODAY);
    expect(currentScore).toBe(0);
  });

  it("returns undefined score when targetValue is missing", () => {
    const t = makeTracker({ type: "build_up", frequency: "daily" });
    const { currentScore } = evaluate(t, [makeLog(TODAY, { value: 50 })], TODAY);
    expect(currentScore).toBeUndefined();
  });

  it("only counts logs within the current period", () => {
    const logs = [
      makeLog(TODAY, { value: 40 }),
      makeLog(daysAgo(1), { value: 100 }), // yesterday — outside daily period
    ];
    const { currentScore } = evaluate(tracker, logs, TODAY);
    expect(currentScore).toBe(40);
  });
});

// ── cut_down ─────────────────────────────────────────────────────────────────

describe("cut_down", () => {
  const tracker = makeTracker({ type: "cut_down", frequency: "daily", targetValue: 100 });

  it("scores 100 when no logs (stayed under)", () => {
    const { currentScore } = evaluate(tracker, [], TODAY);
    expect(currentScore).toBe(100);
  });

  it("scores 50 when at half the limit", () => {
    const logs = [makeLog(TODAY, { value: 50 })];
    const { currentScore } = evaluate(tracker, logs, TODAY);
    expect(currentScore).toBe(50);
  });

  it("scores 0 when at or over the limit", () => {
    const logs = [makeLog(TODAY, { value: 100 })];
    const { currentScore } = evaluate(tracker, logs, TODAY);
    expect(currentScore).toBe(0);
  });

  it("clamps to 0 when over the limit", () => {
    const logs = [makeLog(TODAY, { value: 200 })];
    const { currentScore } = evaluate(tracker, logs, TODAY);
    expect(currentScore).toBe(0);
  });
});

// ── target ───────────────────────────────────────────────────────────────────

describe("target", () => {
  const tracker = makeTracker({ type: "target", targetValue: 100 });

  it("uses the most recent log value", () => {
    const logs = [
      makeLog(daysAgo(5), { value: 20 }),
      makeLog(TODAY, { value: 80 }),
      makeLog(daysAgo(2), { value: 50 }),
    ];
    const { currentScore } = evaluate(tracker, logs, TODAY);
    expect(currentScore).toBe(80);
  });

  it("scores 0 when no logs", () => {
    const { currentScore } = evaluate(tracker, [], TODAY);
    expect(currentScore).toBe(0);
  });

  it("clamps to 100 when value exceeds target", () => {
    const logs = [makeLog(TODAY, { value: 150 })];
    const { currentScore } = evaluate(tracker, logs, TODAY);
    expect(currentScore).toBe(100);
  });
});

// ── range ────────────────────────────────────────────────────────────────────

describe("range", () => {
  const tracker = makeTracker({ type: "range", frequency: "daily", targetMin: 10, targetMax: 20 });

  it("scores 100 when all logs are in range", () => {
    const logs = [makeLog(TODAY, { value: 15 })];
    const { currentScore } = evaluate(tracker, logs, TODAY);
    expect(currentScore).toBe(100);
  });

  it("scores 50 when half of logs are in range", () => {
    const logs = [
      makeLog(TODAY, { value: 15 }),
      makeLog(TODAY + 1000, { value: 5 }),
    ];
    const { currentScore } = evaluate(tracker, logs, TODAY);
    expect(currentScore).toBe(50);
  });

  it("scores 0 when no logs in period", () => {
    const { currentScore } = evaluate(tracker, [], TODAY);
    expect(currentScore).toBe(0);
  });

  it("accepts boundary values as in-range", () => {
    const logs = [
      makeLog(TODAY, { value: 10 }),
      makeLog(TODAY + 1000, { value: 20 }),
    ];
    const { currentScore } = evaluate(tracker, logs, TODAY);
    expect(currentScore).toBe(100);
  });

  it("uses valueMin when present", () => {
    const logs = [makeLog(TODAY, { valueMin: 15, value: 5 })];
    const { currentScore } = evaluate(tracker, logs, TODAY);
    expect(currentScore).toBe(100);
  });
});

// ── status thresholds ────────────────────────────────────────────────────────

describe("status thresholds", () => {
  const tracker = makeTracker({ type: "build_up", frequency: "daily", targetValue: 100 });

  it("on_track at >= 80", () => {
    const { currentStatus } = evaluate(tracker, [makeLog(TODAY, { value: 80 })], TODAY);
    expect(currentStatus).toBe("on_track");
  });

  it("at_risk between 50 and 79", () => {
    const { currentStatus } = evaluate(tracker, [makeLog(TODAY, { value: 50 })], TODAY);
    expect(currentStatus).toBe("at_risk");
  });

  it("off_track below 50", () => {
    const { currentStatus } = evaluate(tracker, [makeLog(TODAY, { value: 30 })], TODAY);
    expect(currentStatus).toBe("off_track");
  });
});

// ── expiry ───────────────────────────────────────────────────────────────────

describe("expired tracker", () => {
  it("returns achieved when score is 100 and tracker expired", () => {
    const tracker = makeTracker({
      type: "build_up",
      frequency: "daily",
      targetValue: 100,
      endDateHijri: "14460101", // clearly in the past
    });
    const logs = [makeLog(TODAY, { value: 100 })];
    const { currentStatus } = evaluate(tracker, logs, TODAY);
    expect(currentStatus).toBe("achieved");
  });

  it("returns failed when score < 100 and tracker expired", () => {
    const tracker = makeTracker({
      type: "build_up",
      frequency: "daily",
      targetValue: 100,
      endDateHijri: "14460101",
    });
    const logs = [makeLog(TODAY, { value: 60 })];
    const { currentStatus } = evaluate(tracker, logs, TODAY);
    expect(currentStatus).toBe("failed");
  });

  it("uses normal status when not expired", () => {
    const tracker = makeTracker({
      type: "build_up",
      frequency: "daily",
      targetValue: 100,
      endDateHijri: "14500101", // far future
    });
    const logs = [makeLog(TODAY, { value: 80 })];
    const { currentStatus } = evaluate(tracker, logs, TODAY);
    expect(currentStatus).toBe("on_track");
  });
});

// ── habit with targetValue (quantified habit) ────────────────────────────────

describe("habit — quantified (targetValue)", () => {
  const tracker = makeTracker({ type: "habit", frequency: "daily", targetValue: 8 });

  it("scores 100 and streak=1 when today's total meets target", () => {
    const logs = [
      makeLog(TODAY, { value: 5 }),
      makeLog(TODAY, { value: 3 }),
    ];
    const { currentScore, currentStreak } = evaluate(tracker, logs, TODAY);
    expect(currentScore).toBe(100);
    expect(currentStreak).toBe(1);
  });

  it("scores 0 when today's total is below target", () => {
    const logs = [makeLog(TODAY, { value: 5 })];
    const { currentScore, currentStreak } = evaluate(tracker, logs, TODAY);
    expect(currentScore).toBe(0);
    expect(currentStreak).toBe(0);
  });

  it("streak counts consecutive days that each meet target", () => {
    const logs = [
      makeLog(TODAY, { value: 8 }),
      makeLog(daysAgo(1), { value: 10 }),
      makeLog(daysAgo(2), { value: 8 }),
    ];
    const { currentStreak } = evaluate(tracker, logs, TODAY);
    expect(currentStreak).toBe(3);
  });

  it("streak breaks when one day is below target", () => {
    const logs = [
      makeLog(TODAY, { value: 8 }),
      makeLog(daysAgo(1), { value: 4 }), // below target
      makeLog(daysAgo(2), { value: 8 }),
    ];
    const { currentStreak } = evaluate(tracker, logs, TODAY);
    expect(currentStreak).toBe(1);
  });

  it("partial logs accumulate within a day toward target", () => {
    // 3 logs during the day summing to exactly 8
    const logs = [
      makeLog(TODAY, { value: 3 }),
      makeLog(TODAY, { value: 3 }),
      makeLog(TODAY, { value: 2 }),
    ];
    const { currentScore } = evaluate(tracker, logs, TODAY);
    expect(currentScore).toBe(100);
  });
});
