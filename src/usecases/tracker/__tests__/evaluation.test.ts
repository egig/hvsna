import { describe, it, expect } from "vitest";
import { evaluate } from "../evaluation";
import type {
  EvaluationConfig,
  TrackerLog,
} from "../../../domain/tracker/ITrackerRepository";

const DAY = 86_400_000;

// May 5, 2026 (Monday) — stable anchor for all tests
const TODAY = new Date(2026, 4, 5).getTime();

function daysAgo(n: number): number {
  return TODAY - n * DAY;
}

function makeEvaluation(
  overrides: Partial<EvaluationConfig> = {}
): EvaluationConfig {
  return {
    id: "e1",
    metric: "count",
    window: "today",
    ...overrides,
  } as EvaluationConfig;
}

function makeLog(
  occurredAt: number,
  overrides: Partial<TrackerLog> = {}
): TrackerLog {
  return { id: "l", trackerId: "t1", occurredAt, ...overrides } as TrackerLog;
}

// ── Toggle metrics ──────────────────────────────────────────────────────────

describe("toggle — count", () => {
  const evaluation = makeEvaluation({ metric: "count", window: "today" });

  it("returns 1 when logged today", () => {
    const logs = [makeLog(TODAY, { valueBool: true })];
    const result = evaluate(evaluation, logs, TODAY);
    expect(result.value).toBe(1);
  });

  it("returns 0 when no logs", () => {
    const result = evaluate(evaluation, [], TODAY);
    expect(result.value).toBe(0);
  });

  it("ignores logs from yesterday", () => {
    const logs = [makeLog(daysAgo(1), { valueBool: true })];
    const result = evaluate(evaluation, logs, TODAY);
    expect(result.value).toBe(0);
  });
});

describe("toggle — streak", () => {
  const evaluation = makeEvaluation({ metric: "streak", window: "7d" });

  it("returns 1 streak when logged today", () => {
    const logs = [makeLog(TODAY, { valueBool: true })];
    const result = evaluate(evaluation, logs, TODAY);
    expect(result.value).toBe(1);
  });

  it("returns 0 when no done logs", () => {
    const logs = [makeLog(TODAY, { valueBool: false })];
    const result = evaluate(evaluation, logs, TODAY);
    expect(result.value).toBe(0);
  });

  it("counts consecutive-day streak", () => {
    const logs = [
      makeLog(TODAY, { valueBool: true }),
      makeLog(daysAgo(1), { valueBool: true }),
      makeLog(daysAgo(2), { valueBool: true }),
    ];
    const result = evaluate(evaluation, logs, TODAY);
    expect(result.value).toBe(3);
  });

  it("streak breaks when there is a gap", () => {
    const logs = [
      makeLog(TODAY, { valueBool: true }),
      makeLog(daysAgo(3), { valueBool: true }),
      makeLog(daysAgo(1), { valueBool: true }),
    ];
    const result = evaluate(evaluation, logs, TODAY);
    expect(result.value).toBe(2);
  });
});

describe("toggle — consistency", () => {
  const evaluation = makeEvaluation({ metric: "consistency", window: "7d" });

  it("returns 100 when all 7 days are done", () => {
    const logs = [0, 1, 2, 3, 4, 5, 6].map((n) =>
      makeLog(daysAgo(n), { valueBool: true })
    );
    const result = evaluate(evaluation, logs, TODAY);
    expect(result.value).toBe(100);
  });

  it("returns ~14.3 when 1 of 7 days is done", () => {
    const logs = [makeLog(TODAY, { valueBool: true })];
    const result = evaluate(evaluation, logs, TODAY);
    expect(result.value).toBeCloseTo(14.286, 1);
  });
});

describe("toggle — rate", () => {
  const evaluation = makeEvaluation({ metric: "rate", window: "7d" });

  it("returns 1 when all days done", () => {
    const logs = [0, 1, 2, 3, 4, 5, 6].map((n) =>
      makeLog(daysAgo(n), { valueBool: true })
    );
    const result = evaluate(evaluation, logs, TODAY);
    expect(result.value).toBe(1);
  });

  it("returns 0 when no days done", () => {
    const result = evaluate(evaluation, [], TODAY);
    expect(result.value).toBe(0);
  });
});

describe("toggle — gap", () => {
  const evaluation = makeEvaluation({ metric: "gap", window: "7d" });

  it("returns 0 when logged today", () => {
    const logs = [makeLog(TODAY, { valueBool: true })];
    const result = evaluate(evaluation, logs, TODAY);
    expect(result.value).toBe(0);
  });

  it("returns days since last log", () => {
    const logs = [makeLog(daysAgo(2), { valueBool: true })];
    const result = evaluate(evaluation, logs, TODAY);
    expect(result.value).toBe(2);
  });
});

// ── Add metrics ───────────────────────────────────────────────────────────────

describe("add — sum", () => {
  const evaluation = makeEvaluation({ metric: "sum", window: "today" });

  it("sums values for today", () => {
    const logs = [makeLog(TODAY, { value: 5 }), makeLog(TODAY, { value: 3 })];
    const result = evaluate(evaluation, logs, TODAY);
    expect(result.value).toBe(8);
  });

  it("ignores yesterday's values", () => {
    const logs = [
      makeLog(TODAY, { value: 5 }),
      makeLog(daysAgo(1), { value: 100 }),
    ];
    const result = evaluate(evaluation, logs, TODAY);
    expect(result.value).toBe(5);
  });
});

describe("add — average", () => {
  const evaluation = makeEvaluation({ metric: "average", window: "7d" });

  it("computes average of values", () => {
    const logs = [
      makeLog(TODAY, { value: 10 }),
      makeLog(daysAgo(1), { value: 20 }),
    ];
    const result = evaluate(evaluation, logs, TODAY);
    expect(result.value).toBe(15);
  });

  it("returns 0 with no logs", () => {
    const result = evaluate(evaluation, [], TODAY);
    expect(result.value).toBe(0);
  });
});

describe("add — per_day", () => {
  const evaluation = makeEvaluation({ metric: "per_day", window: "7d" });

  it("divides sum by window days", () => {
    const logs = [makeLog(TODAY, { value: 70 })];
    const result = evaluate(evaluation, logs, TODAY);
    expect(result.value).toBe(10);
  });
});

describe("add — count", () => {
  const evaluation = makeEvaluation({ metric: "count", window: "7d" });

  it("counts logs in window", () => {
    const logs = [
      makeLog(TODAY, { value: 5 }),
      makeLog(daysAgo(1), { value: 3 }),
      makeLog(daysAgo(10), { value: 100 }),
    ];
    const result = evaluate(evaluation, logs, TODAY);
    expect(result.value).toBe(2);
  });
});

describe("add — min / max", () => {
  it("returns min value", () => {
    const evaluation = makeEvaluation({ metric: "min", window: "7d" });
    const logs = [
      makeLog(TODAY, { value: 5 }),
      makeLog(daysAgo(1), { value: 3 }),
    ];
    expect(evaluate(evaluation, logs, TODAY).value).toBe(3);
  });

  it("returns max value", () => {
    const evaluation = makeEvaluation({ metric: "max", window: "7d" });
    const logs = [
      makeLog(TODAY, { value: 5 }),
      makeLog(daysAgo(1), { value: 20 }),
    ];
    expect(evaluate(evaluation, logs, TODAY).value).toBe(20);
  });
});

describe("add — trend", () => {
  const evaluation = makeEvaluation({ metric: "trend", window: "7d" });

  it("returns relative change from previous to latest", () => {
    const logs = [
      makeLog(TODAY, { value: 15 }),
      makeLog(daysAgo(1), { value: 10 }),
    ];
    const result = evaluate(evaluation, logs, TODAY);
    expect(result.value).toBe(0.5);
  });

  it("returns 0 when only one log", () => {
    const logs = [makeLog(TODAY, { value: 10 })];
    const result = evaluate(evaluation, logs, TODAY);
    expect(result.value).toBe(0);
  });
});

// ── Set metrics ─────────────────────────────────────────────────────────────

describe("set — latest", () => {
  const evaluation = makeEvaluation({ metric: "latest", window: "7d" });

  it("returns most recent value", () => {
    const logs = [
      makeLog(TODAY, { value: 75 }),
      makeLog(daysAgo(1), { value: 70 }),
    ];
    const result = evaluate(evaluation, logs, TODAY);
    expect(result.value).toBe(75);
  });
});

describe("set — delta", () => {
  const evaluation = makeEvaluation({ metric: "delta", window: "7d" });

  it("returns difference between latest and previous", () => {
    const logs = [
      makeLog(TODAY, { value: 75 }),
      makeLog(daysAgo(1), { value: 70 }),
    ];
    const result = evaluate(evaluation, logs, TODAY);
    expect(result.value).toBe(5);
  });

  it("returns negative delta when decreased", () => {
    const logs = [
      makeLog(TODAY, { value: 65 }),
      makeLog(daysAgo(1), { value: 70 }),
    ];
    const result = evaluate(evaluation, logs, TODAY);
    expect(result.value).toBe(-5);
  });

  it("returns 0 with fewer than 2 logs", () => {
    const logs = [makeLog(TODAY, { value: 70 })];
    const result = evaluate(evaluation, logs, TODAY);
    expect(result.value).toBe(0);
  });
});

// ── Comparison / success ──────────────────────────────────────────────────────

describe("comparison operators", () => {
  it("success = true when value >= target", () => {
    const evaluation = makeEvaluation({
      metric: "count",
      window: "today",
      operator: ">=",
      target: 3,
    });
    const logs = [
      makeLog(TODAY, { valueBool: true }),
      makeLog(TODAY, { valueBool: true }),
      makeLog(TODAY, { valueBool: true }),
    ];
    const result = evaluate(evaluation, logs, TODAY);
    expect(result.value).toBe(3);
    expect(result.success).toBe(true);
  });

  it("success = false when value < target", () => {
    const evaluation = makeEvaluation({
      metric: "count",
      window: "today",
      operator: ">=",
      target: 5,
    });
    const logs = [makeLog(TODAY, { valueBool: true })];
    const result = evaluate(evaluation, logs, TODAY);
    expect(result.value).toBe(1);
    expect(result.success).toBe(false);
  });

  it("success = true with <= operator", () => {
    const evaluation = makeEvaluation({
      metric: "sum",
      window: "today",
      operator: "<=",
      target: 10,
    });
    const logs = [makeLog(TODAY, { value: 5 })];
    const result = evaluate(evaluation, logs, TODAY);
    expect(result.success).toBe(true);
  });

  it("success = true with == operator", () => {
    const evaluation = makeEvaluation({
      metric: "count",
      window: "today",
      operator: "==",
      target: 2,
    });
    const logs = [
      makeLog(TODAY, { valueBool: true }),
      makeLog(TODAY, { valueBool: true }),
    ];
    const result = evaluate(evaluation, logs, TODAY);
    expect(result.success).toBe(true);
  });

  it("success is undefined when no target set", () => {
    const evaluation = makeEvaluation({ metric: "count", window: "today" });
    const logs = [makeLog(TODAY, { valueBool: true })];
    const result = evaluate(evaluation, logs, TODAY);
    expect(result.success).toBeUndefined();
  });
});

// ── Window filtering ──────────────────────────────────────────────────────────

describe("window filtering", () => {
  it("7d window includes logs from last 7 days", () => {
    const evaluation = makeEvaluation({ metric: "count", window: "7d" });
    const logs = [
      makeLog(TODAY, { valueBool: true }),
      makeLog(daysAgo(6), { valueBool: true }),
      makeLog(daysAgo(8), { valueBool: true }),
    ];
    const result = evaluate(evaluation, logs, TODAY);
    expect(result.value).toBe(2);
  });

  it("30d window includes logs from last 30 days", () => {
    const evaluation = makeEvaluation({ metric: "count", window: "30d" });
    const logs = [
      makeLog(TODAY, { valueBool: true }),
      makeLog(daysAgo(29), { valueBool: true }),
      makeLog(daysAgo(31), { valueBool: true }),
    ];
    const result = evaluate(evaluation, logs, TODAY);
    expect(result.value).toBe(2);
  });
});
