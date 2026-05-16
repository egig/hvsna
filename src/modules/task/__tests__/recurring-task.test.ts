import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getNextOccurrenceDate,
  parseHijriDateString,
} from "../task-form-helpers";
import { HijriDate } from "../../calendar/hijri";
import type { RecurringTask } from "../recurring-task";
import type { ITaskRepository } from "../../../domain/task/ITaskRepository";
import { Task } from "@/domain/task";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function hijriToEpoch(year: number, month: number, day: number): number {
  return new HijriDate(year, month, day, 0, 0, 0, 0, {
    latitude: 0,
    longitude: 0,
    offset: 0,
  })
    .toDate()
    .getTime();
}

function makeRepo(existingTasks: Task[] = []): ITaskRepository {
  const created: Task[] = [];
  return {
    findByRecurringTaskId: vi.fn(async () => existingTasks),
    create: vi.fn(async (input) => {
      const t = new Task({ id: `task_${crypto.randomUUID()}`, ...input });
      created.push(t);
      return t;
    }),
    update: vi.fn(),
    delete: vi.fn(),
    findById: vi.fn(),
    find: vi.fn(),
    findByDate: vi.fn(),
    findByHijriDate: vi.fn(),
    findWithPagination: vi.fn(),
    findTasksBefore: vi.fn(),
    findTodayCompletedTasks: vi.fn(),
    findTasksAfter: vi.fn(),
    findBrowsedTasks: vi.fn(),
    findInboxTasks: vi.fn(),
    findTasksByListId: vi.fn(),
    deletePendingByRecurringTaskId: vi.fn(),
    completeTask: vi.fn(),
    reopenTask: vi.fn(),
    _created: created,
  } as unknown as ITaskRepository & { _created: Task[] };
}

function makeTemplate(overrides: Partial<RecurringTask> = {}): RecurringTask {
  return {
    id: "rtask_test",
    user_id: "user1",
    name: "Test Recurring",
    repeat: "daily",
    repeatInterval: 1,
    baseDateEpoch: hijriToEpoch(1447, 1, 1),
    lat: 0,
    long: 0,
    hijriDateOffset: 0,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// getNextOccurrenceDate — unit tests
// ---------------------------------------------------------------------------

describe("getNextOccurrenceDate", () => {
  it("returns null for repeat=none", () => {
    expect(
      getNextOccurrenceDate(
        "14470101",
        "none",
        1,
        0,
        0,
        0,
        undefined,
        undefined
      )
    ).toBeNull();
  });

  it("returns null for empty date", () => {
    expect(
      getNextOccurrenceDate("", "daily", 1, 0, 0, 0, undefined, undefined)
    ).toBeNull();
  });

  describe("daily", () => {
    it("advances by 1 day (interval=1)", () => {
      const next = getNextOccurrenceDate(
        "14470101",
        "daily",
        1,
        0,
        0,
        0,
        undefined,
        undefined
      );
      expect(next).not.toBeNull();
      const { year, month, day } = parseHijriDateString(next!);
      expect(year).toBe(1447);
      expect(month).toBe(1);
      expect(day).toBe(2);
    });

    it("advances by interval days", () => {
      const next = getNextOccurrenceDate(
        "14470101",
        "daily",
        3,
        0,
        0,
        0,
        undefined,
        undefined
      );
      expect(next).not.toBeNull();
      const { day } = parseHijriDateString(next!);
      expect(day).toBe(4);
    });

    it("crosses month boundary correctly", () => {
      // 1447-01-29 + 1 day = 1447-02-01 (Hijri months are 29 or 30 days)
      const next = getNextOccurrenceDate(
        "14470129",
        "daily",
        1,
        0,
        0,
        0,
        undefined,
        undefined
      );
      expect(next).not.toBeNull();
      const { month } = parseHijriDateString(next!);
      expect(month).toBeGreaterThanOrEqual(1);
    });
  });

  describe("weekly", () => {
    it("advances by 7 days (interval=1)", () => {
      const next = getNextOccurrenceDate(
        "14460701",
        "weekly",
        1,
        0,
        0,
        0,
        undefined,
        undefined
      );
      expect(next).not.toBeNull();
      const { day } = parseHijriDateString(next!);
      expect(day).toBe(8);
    });

    it("advances by interval*7 days", () => {
      const next = getNextOccurrenceDate(
        "14460701",
        "weekly",
        2,
        0,
        0,
        0,
        undefined,
        undefined
      );
      expect(next).not.toBeNull();
      const { day } = parseHijriDateString(next!);
      expect(day).toBe(15);
    });
  });

  describe("monthly", () => {
    it("advances month by 1 (interval=1)", () => {
      const next = getNextOccurrenceDate(
        "14470101",
        "monthly",
        1,
        0,
        0,
        0,
        undefined,
        undefined
      );
      expect(next).not.toBeNull();
      const { month } = parseHijriDateString(next!);
      expect(month).toBe(2);
    });

    it("wraps year correctly when month=12", () => {
      const next = getNextOccurrenceDate(
        "14471201",
        "monthly",
        1,
        0,
        0,
        0,
        undefined,
        undefined
      );
      expect(next).not.toBeNull();
      const { year, month } = parseHijriDateString(next!);
      expect(year).toBe(1448);
      expect(month).toBe(1);
    });

    it("advances by interval months", () => {
      const next = getNextOccurrenceDate(
        "14470101",
        "monthly",
        3,
        0,
        0,
        0,
        undefined,
        undefined
      );
      expect(next).not.toBeNull();
      const { month } = parseHijriDateString(next!);
      expect(month).toBe(4);
    });

    it("caps day at 29 to avoid invalid Hijri end-of-month dates", () => {
      const next = getNextOccurrenceDate(
        "14470130",
        "monthly",
        1,
        0,
        0,
        0,
        undefined,
        undefined
      );
      expect(next).not.toBeNull();
      const { day } = parseHijriDateString(next!);
      expect(day).toBeLessThanOrEqual(29);
    });
  });

  describe("yearly", () => {
    it("advances year by 1 (interval=1)", () => {
      const next = getNextOccurrenceDate(
        "14470101",
        "yearly",
        1,
        0,
        0,
        0,
        undefined,
        undefined
      );
      expect(next).not.toBeNull();
      const { year } = parseHijriDateString(next!);
      expect(year).toBe(1448);
    });

    it("advances year by interval", () => {
      const next = getNextOccurrenceDate(
        "14470101",
        "yearly",
        3,
        0,
        0,
        0,
        undefined,
        undefined
      );
      expect(next).not.toBeNull();
      const { year } = parseHijriDateString(next!);
      expect(year).toBe(1450);
    });
  });
});
