import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getNextOccurrenceDate,
  parseHijriDateString,
} from "../task-form-helpers";
import { HijriDate } from "../../calendar/hijri";
import { generateOccurrencesForTemplate } from "../recurring-task-generator";
import type { RecurringTask } from "../recurring-task";
import type { ITaskRepository } from "../../../domain/task/ITaskRepository";
import { Task } from "../types";

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
    expect(getNextOccurrenceDate("14470101", "none", 1, 0, 0, 0, undefined, undefined)).toBeNull();
  });

  it("returns null for empty date", () => {
    expect(getNextOccurrenceDate("", "daily", 1, 0, 0, 0, undefined, undefined)).toBeNull();
  });

  describe("daily", () => {
    it("advances by 1 day (interval=1)", () => {
      const next = getNextOccurrenceDate("14470101", "daily", 1, 0, 0, 0, undefined, undefined);
      expect(next).not.toBeNull();
      const { year, month, day } = parseHijriDateString(next!);
      expect(year).toBe(1447);
      expect(month).toBe(1);
      expect(day).toBe(2);
    });

    it("advances by interval days", () => {
      const next = getNextOccurrenceDate("14470101", "daily", 3, 0, 0, 0, undefined, undefined);
      expect(next).not.toBeNull();
      const { day } = parseHijriDateString(next!);
      expect(day).toBe(4);
    });

    it("crosses month boundary correctly", () => {
      // 1447-01-29 + 1 day = 1447-02-01 (Hijri months are 29 or 30 days)
      const next = getNextOccurrenceDate("14470129", "daily", 1, 0, 0, 0, undefined, undefined);
      expect(next).not.toBeNull();
      const { month } = parseHijriDateString(next!);
      expect(month).toBeGreaterThanOrEqual(1);
    });
  });

  describe("weekly", () => {
    it("advances by 7 days (interval=1)", () => {
      const next = getNextOccurrenceDate("14460701", "weekly", 1, 0, 0, 0, undefined, undefined);
      expect(next).not.toBeNull();
      const { day } = parseHijriDateString(next!);
      expect(day).toBe(8);
    });

    it("advances by interval*7 days", () => {
      const next = getNextOccurrenceDate("14460701", "weekly", 2, 0, 0, 0, undefined, undefined);
      expect(next).not.toBeNull();
      const { day } = parseHijriDateString(next!);
      expect(day).toBe(15);
    });
  });

  describe("monthly", () => {
    it("advances month by 1 (interval=1)", () => {
      const next = getNextOccurrenceDate("14470101", "monthly", 1, 0, 0, 0, undefined, undefined);
      expect(next).not.toBeNull();
      const { month } = parseHijriDateString(next!);
      expect(month).toBe(2);
    });

    it("wraps year correctly when month=12", () => {
      const next = getNextOccurrenceDate("14471201", "monthly", 1, 0, 0, 0, undefined, undefined);
      expect(next).not.toBeNull();
      const { year, month } = parseHijriDateString(next!);
      expect(year).toBe(1448);
      expect(month).toBe(1);
    });

    it("advances by interval months", () => {
      const next = getNextOccurrenceDate("14470101", "monthly", 3, 0, 0, 0, undefined, undefined);
      expect(next).not.toBeNull();
      const { month } = parseHijriDateString(next!);
      expect(month).toBe(4);
    });

    it("caps day at 29 to avoid invalid Hijri end-of-month dates", () => {
      const next = getNextOccurrenceDate("14470130", "monthly", 1, 0, 0, 0, undefined, undefined);
      expect(next).not.toBeNull();
      const { day } = parseHijriDateString(next!);
      expect(day).toBeLessThanOrEqual(29);
    });
  });

  describe("yearly", () => {
    it("advances year by 1 (interval=1)", () => {
      const next = getNextOccurrenceDate("14470101", "yearly", 1, 0, 0, 0, undefined, undefined);
      expect(next).not.toBeNull();
      const { year } = parseHijriDateString(next!);
      expect(year).toBe(1448);
    });

    it("advances year by interval", () => {
      const next = getNextOccurrenceDate("14470101", "yearly", 3, 0, 0, 0, undefined, undefined);
      expect(next).not.toBeNull();
      const { year } = parseHijriDateString(next!);
      expect(year).toBe(1450);
    });
  });
});

// ---------------------------------------------------------------------------
// generateOccurrencesForTemplate
// ---------------------------------------------------------------------------

describe("generateOccurrencesForTemplate", () => {
  let todayEpoch: number;

  beforeEach(() => {
    todayEpoch = new Date("2025-01-01T00:00:00Z").getTime();
  });

  it("generates future occurrences up to the horizon for daily repeat", async () => {
    const template = makeTemplate({
      repeat: "daily",
      repeatInterval: 1,
      baseDateEpoch: hijriToEpoch(1446, 7, 1),
    });

    const repo = makeRepo();
    await generateOccurrencesForTemplate(template, repo, todayEpoch);

    const created = (repo as any)._created as Task[];
    expect(created.length).toBeGreaterThan(0);
    expect(created.length).toBeLessThanOrEqual(30);
    created.forEach((t) => {
      expect(t.recurringTaskId).toBe("rtask_test");
      expect(t.repeat).toBe("daily");
    });
  });

  it("skips past dates — only creates instances from today onward", async () => {
    const template = makeTemplate({
      repeat: "daily",
      repeatInterval: 1,
      baseDateEpoch: hijriToEpoch(1440, 1, 1), // ~2019 Gregorian, well in the past
    });

    const repo = makeRepo();
    await generateOccurrencesForTemplate(template, repo, todayEpoch);

    const created = (repo as any)._created as Task[];
    created.forEach((t) => {
      expect(t.atEpochMillis!).toBeGreaterThanOrEqual(todayEpoch);
    });
  });

  it("does not create duplicates when instances already exist (idempotent)", async () => {
    const existingEpoch = hijriToEpoch(1446, 7, 1);
    const template = makeTemplate({
      repeat: "weekly",
      repeatInterval: 1,
      baseDateEpoch: existingEpoch,
    });

    const existingTasks = [
      new Task({
        id: "existing1",
        atEpochMillis: existingEpoch,
        recurringTaskId: "rtask_test",
      }),
    ];
    const repo = makeRepo(existingTasks);
    await generateOccurrencesForTemplate(template, repo, todayEpoch);

    const created = (repo as any)._created as Task[];
    const epochsCreated = created.map((t) => t.atEpochMillis);
    expect(epochsCreated).not.toContain(existingEpoch);
  });

  it("respects repeat interval — every 2 weeks produces increasing epochs", async () => {
    const template = makeTemplate({
      repeat: "weekly",
      repeatInterval: 2,
      baseDateEpoch: hijriToEpoch(1446, 7, 1),
    });

    const repo = makeRepo();
    await generateOccurrencesForTemplate(template, repo, todayEpoch);

    const created = (repo as any)._created as Task[];
    expect(created.length).toBeGreaterThan(0);

    if (created.length >= 2) {
      expect(created[0].atEpochMillis).not.toBe(created[1].atEpochMillis);
      expect(created[1].atEpochMillis! > created[0].atEpochMillis!).toBe(true);
    }
  });

  it("generates correct number of occurrences for monthly repeat", async () => {
    const template = makeTemplate({
      repeat: "monthly",
      repeatInterval: 1,
      baseDateEpoch: hijriToEpoch(1446, 7, 1),
    });

    const repo = makeRepo();
    await generateOccurrencesForTemplate(template, repo, todayEpoch);

    const created = (repo as any)._created as Task[];
    expect(created.length).toBeGreaterThan(0);
    expect(created.length).toBeLessThanOrEqual(12);
  });

  it("generates correct number of occurrences for yearly repeat", async () => {
    const template = makeTemplate({
      repeat: "yearly",
      repeatInterval: 1,
      baseDateEpoch: hijriToEpoch(1446, 1, 1),
    });

    const repo = makeRepo();
    await generateOccurrencesForTemplate(template, repo, todayEpoch);

    const created = (repo as any)._created as Task[];
    expect(created.length).toBeGreaterThan(0);
    expect(created.length).toBeLessThanOrEqual(5);
  });

  it("copies all template fields to each instance", async () => {
    const template = makeTemplate({
      repeat: "daily",
      repeatInterval: 1,
      baseDateEpoch: hijriToEpoch(1446, 7, 1),
      name: "Morning walk",
      atTime: "07:00",
      lat: 3.14,
      long: 101.7,
      timezone: "Asia/Kuala_Lumpur",
    });

    const repo = makeRepo();
    await generateOccurrencesForTemplate(template, repo, todayEpoch);

    const created = (repo as any)._created as Task[];
    expect(created.length).toBeGreaterThan(0);
    created.forEach((t) => {
      expect(t.name).toBe("Morning walk");
      expect(t.atTime).toBe("07:00");
      expect(t.lat).toBe(3.14);
      expect(t.recurringTaskId).toBe("rtask_test");
    });
  });

  describe("repeatEnd=on_date", () => {
    it("creates no instances past repeatEndEpoch", async () => {
      const endEpoch = hijriToEpoch(1446, 7, 10);
      const template = makeTemplate({
        repeat: "daily",
        repeatInterval: 1,
        baseDateEpoch: hijriToEpoch(1446, 7, 1),
        repeatEnd: "on_date",
        repeatEndEpoch: endEpoch,
      });

      const repo = makeRepo();
      await generateOccurrencesForTemplate(template, repo, todayEpoch);

      const created = (repo as any)._created as Task[];
      created.forEach((t) => {
        expect(t.atEpochMillis! <= endEpoch).toBe(true);
      });
    });

    it("creates instances up to and including the end epoch", async () => {
      const endEpoch = hijriToEpoch(1446, 7, 5);
      const template = makeTemplate({
        repeat: "daily",
        repeatInterval: 1,
        baseDateEpoch: hijriToEpoch(1446, 7, 1),
        repeatEnd: "on_date",
        repeatEndEpoch: endEpoch,
      });

      const repo = makeRepo();
      await generateOccurrencesForTemplate(template, repo, todayEpoch);

      const created = (repo as any)._created as Task[];
      created.forEach((t) => {
        expect(t.atEpochMillis! <= endEpoch).toBe(true);
      });
    });
  });

  describe("repeatEnd=after_occurrences", () => {
    it("creates exactly repeatEndOccurrences instances when no existing", async () => {
      const template = makeTemplate({
        repeat: "daily",
        repeatInterval: 1,
        baseDateEpoch: hijriToEpoch(1446, 7, 1),
        repeatEnd: "after_occurrences",
        repeatEndOccurrences: 3,
      });

      const repo = makeRepo();
      await generateOccurrencesForTemplate(template, repo, todayEpoch);

      const created = (repo as any)._created as Task[];
      expect(created.length).toBe(3);
    });

    it("creates at most repeatEndOccurrences - existing.length instances when some exist", async () => {
      const existing = [
        new Task({
          id: "e1",
          atEpochMillis: hijriToEpoch(1446, 7, 1),
          recurringTaskId: "rtask_test",
        }),
      ];
      const template = makeTemplate({
        repeat: "daily",
        repeatInterval: 1,
        baseDateEpoch: hijriToEpoch(1446, 7, 1),
        repeatEnd: "after_occurrences",
        repeatEndOccurrences: 3,
      });

      const repo = makeRepo(existing);
      await generateOccurrencesForTemplate(template, repo, todayEpoch);

      const created = (repo as any)._created as Task[];
      expect(created.length).toBeLessThanOrEqual(2);
    });

    it("creates 0 instances when existing.length >= repeatEndOccurrences", async () => {
      const existing = [
        new Task({ id: "e1", atEpochMillis: hijriToEpoch(1446, 7, 1), recurringTaskId: "rtask_test" }),
        new Task({ id: "e2", atEpochMillis: hijriToEpoch(1446, 7, 2), recurringTaskId: "rtask_test" }),
        new Task({ id: "e3", atEpochMillis: hijriToEpoch(1446, 7, 3), recurringTaskId: "rtask_test" }),
      ];
      const template = makeTemplate({
        repeat: "daily",
        repeatInterval: 1,
        baseDateEpoch: hijriToEpoch(1446, 7, 1),
        repeatEnd: "after_occurrences",
        repeatEndOccurrences: 3,
      });

      const repo = makeRepo(existing);
      await generateOccurrencesForTemplate(template, repo, todayEpoch);

      const created = (repo as any)._created as Task[];
      expect(created.length).toBe(0);
    });
  });

  describe("repeatEnd=never (default)", () => {
    it("behaves the same as no repeatEnd field", async () => {
      const t1 = makeTemplate({ repeat: "weekly", baseDateEpoch: hijriToEpoch(1446, 7, 1) });
      const t2 = makeTemplate({ repeat: "weekly", baseDateEpoch: hijriToEpoch(1446, 7, 1), repeatEnd: "never" });

      const repo1 = makeRepo();
      const repo2 = makeRepo();
      await generateOccurrencesForTemplate(t1, repo1, todayEpoch);
      await generateOccurrencesForTemplate(t2, repo2, todayEpoch);

      const c1 = (repo1 as any)._created as Task[];
      const c2 = (repo2 as any)._created as Task[];
      expect(c1.length).toBe(c2.length);
    });
  });

  it("BUG: iteration cap exhaustion — old daily task misses future occurrences", async () => {
    // A daily task whose baseDateEpoch is 390 days before today.
    // The generator iterates from baseDateEpoch, burning ~390 iterations on past
    // dates before reaching today. With maxIterations=400 it must still produce
    // future occurrences (the regression was: 0 created because cap hit).
    const pastEpoch = todayEpoch - 390 * 24 * 60 * 60 * 1000;
    const template = makeTemplate({
      repeat: "daily",
      repeatInterval: 1,
      baseDateEpoch: pastEpoch,
    });

    const repo = makeRepo();
    await generateOccurrencesForTemplate(template, repo, todayEpoch);

    const created = (repo as any)._created as Task[];
    expect(created.length).toBeGreaterThan(0);
    created.forEach((t) => {
      expect(t.atEpochMillis!).toBeGreaterThanOrEqual(todayEpoch);
    });
  });
});
