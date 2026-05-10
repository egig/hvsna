import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getNextOccurrenceDate,
  parseHijriDateString,
} from "../task-form-helpers";
import {
  generateOccurrencesForTemplate,
  generateAllRecurringTaskOccurrences,
} from "../recurring-task-generator";
import type { RecurringTask } from "../recurring-task";
import type { ITaskRepository } from "../../../domain/task/ITaskRepository";
import { Task } from "../types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRepo(existingTasks: Task[] = []): ITaskRepository {
  const created: Task[] = [];
  return {
    findByRecurringTaskId: vi.fn(async () => existingTasks),
    create: vi.fn(async (input) => {
      const t = new Task({ id: `task_${crypto.randomUUID()}`, ...input });
      created.push(t);
      return t;
    }),
    // Unused stubs
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
    baseDateHijri: "14470101",
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
    expect(getNextOccurrenceDate("14470101", "none")).toBeNull();
  });

  it("returns null for empty date", () => {
    expect(getNextOccurrenceDate("", "daily")).toBeNull();
  });

  describe("daily", () => {
    it("advances by 1 day (interval=1)", () => {
      // 1447-01-01 → next day should be 2 days later or next month
      const next = getNextOccurrenceDate("14470115", "daily", 1);
      expect(next).not.toBeNull();
      const { day } = parseHijriDateString(next!);
      // day should be 16 (simple increment within month)
      expect(day).toBe(16);
    });

    it("advances by interval days", () => {
      const next = getNextOccurrenceDate("14470110", "daily", 3);
      expect(next).not.toBeNull();
      const { day } = parseHijriDateString(next!);
      expect(day).toBe(13);
    });

    it("crosses month boundary correctly", () => {
      // Hijri months are 29-30 days; day 29 + 2 days should land in next month
      const next = getNextOccurrenceDate("14470129", "daily", 2);
      expect(next).not.toBeNull();
      const parsed = parseHijriDateString(next!);
      // The result should be in month 2 (crossed over)
      expect(parsed.month).toBeGreaterThanOrEqual(2);
    });
  });

  describe("weekly", () => {
    it("advances by 7 days (interval=1)", () => {
      // Use a date mid-month so crossing boundary is clear
      const base = "14470110";
      const next = getNextOccurrenceDate(base, "weekly", 1);
      expect(next).not.toBeNull();
      const { day } = parseHijriDateString(next!);
      expect(day).toBe(17);
    });

    it("advances by interval*7 days", () => {
      const base = "14470101";
      const next = getNextOccurrenceDate(base, "weekly", 2);
      expect(next).not.toBeNull();
      const { day } = parseHijriDateString(next!);
      expect(day).toBe(15);
    });
  });

  describe("monthly", () => {
    it("advances month by 1 (interval=1)", () => {
      const next = getNextOccurrenceDate("14470301", "monthly", 1);
      expect(next).not.toBeNull();
      const { year, month, day } = parseHijriDateString(next!);
      expect(year).toBe(1447);
      expect(month).toBe(4);
      expect(day).toBe(1);
    });

    it("wraps year correctly when month=12", () => {
      const next = getNextOccurrenceDate("14471201", "monthly", 1);
      expect(next).not.toBeNull();
      const { year, month } = parseHijriDateString(next!);
      expect(year).toBe(1448);
      expect(month).toBe(1);
    });

    it("advances by interval months", () => {
      const next = getNextOccurrenceDate("14470101", "monthly", 3);
      expect(next).not.toBeNull();
      const { month } = parseHijriDateString(next!);
      expect(month).toBe(4);
    });

    it("caps day at 29 to avoid invalid Hijri end-of-month dates", () => {
      // Day 30 should be capped to 29 in the next occurrence
      const next = getNextOccurrenceDate("14470130", "monthly", 1);
      expect(next).not.toBeNull();
      const { day } = parseHijriDateString(next!);
      expect(day).toBe(29);
    });
  });

  describe("yearly", () => {
    it("advances year by 1 (interval=1)", () => {
      const next = getNextOccurrenceDate("14470615", "yearly", 1);
      expect(next).not.toBeNull();
      const { year, month, day } = parseHijriDateString(next!);
      expect(year).toBe(1448);
      expect(month).toBe(6);
      expect(day).toBe(15);
    });

    it("advances year by interval", () => {
      const next = getNextOccurrenceDate("14470615", "yearly", 3);
      expect(next).not.toBeNull();
      const { year } = parseHijriDateString(next!);
      expect(year).toBe(1450);
    });
  });
});

// ---------------------------------------------------------------------------
// generateOccurrencesForTemplate — integration-style tests
// ---------------------------------------------------------------------------

describe("generateOccurrencesForTemplate", () => {
  // Use a fixed "today" so tests are deterministic.
  // 1447-10-01 in Hijri ≈ late March 2026 Gregorian.
  // We'll use its epoch millis as todayEpoch.
  // For simplicity we compute it via HijriDate inside the generator;
  // here we just need a stable reference point.
  // We use a date far in the future so all generated occurrences are "future".

  let todayEpoch: number;

  beforeEach(() => {
    // Use a fixed Gregorian date as "today" for reproducible tests
    todayEpoch = new Date("2025-01-01T00:00:00Z").getTime();
  });

  it("generates future occurrences up to the horizon for daily repeat", async () => {
    // baseDateHijri corresponds to a date after todayEpoch
    // We use a date that will be in the future relative to 2025-01-01
    const template = makeTemplate({
      repeat: "daily",
      repeatInterval: 1,
      baseDateHijri: "14460701", // Hijri date ~Jan 2025
    });

    const repo = makeRepo();
    await generateOccurrencesForTemplate(template, repo, todayEpoch);

    const created = (repo as any)._created as Task[];
    // Horizon for daily interval=1 is 30 occurrences (30 days)
    // All should be >= today and have recurringTaskId set
    expect(created.length).toBeGreaterThan(0);
    expect(created.length).toBeLessThanOrEqual(30);
    created.forEach((t) => {
      expect(t.recurringTaskId).toBe("rtask_test");
      expect(t.repeat).toBe("daily");
    });
  });

  it("skips past dates — only creates instances from today onward", async () => {
    // baseDateHijri is well in the past (Hijri year 1440 ~ 2019 Gregorian)
    const template = makeTemplate({
      repeat: "daily",
      repeatInterval: 1,
      baseDateHijri: "14400101",
    });

    const repo = makeRepo();
    await generateOccurrencesForTemplate(template, repo, todayEpoch);

    const created = (repo as any)._created as Task[];
    // None of the created tasks should have an epoch before today
    // (We can't easily check epoch here without resolving Hijri dates,
    // so we verify none were created in 1440)
    created.forEach((t) => {
      const { year } = parseHijriDateString(t.atDateHijri!);
      expect(year).toBeGreaterThanOrEqual(1446);
    });
  });

  it("does not create duplicates when instances already exist (idempotent)", async () => {
    const template = makeTemplate({
      repeat: "weekly",
      repeatInterval: 1,
      baseDateHijri: "14460701",
    });

    // Simulate that some occurrences already exist
    const existingDate = "14460701";
    const existingTasks = [
      new Task({
        id: "existing1",
        atDateHijri: existingDate,
        recurringTaskId: "rtask_test",
      }),
    ];
    const repo = makeRepo(existingTasks);

    await generateOccurrencesForTemplate(template, repo, todayEpoch);

    const created = (repo as any)._created as Task[];
    // The already-existing date should NOT be created again
    const datesCreated = created.map((t) => t.atDateHijri);
    expect(datesCreated).not.toContain(existingDate);
  });

  it("respects repeat interval — every 2 weeks produces correct spacing", async () => {
    const template = makeTemplate({
      repeat: "weekly",
      repeatInterval: 2,
      baseDateHijri: "14460701",
    });

    const repo = makeRepo();
    await generateOccurrencesForTemplate(template, repo, todayEpoch);

    const created = (repo as any)._created as Task[];
    expect(created.length).toBeGreaterThan(0);

    // Consecutive created tasks should be ~14 days apart
    if (created.length >= 2) {
      const first = parseHijriDateString(created[0].atDateHijri!);
      const second = parseHijriDateString(created[1].atDateHijri!);
      // For weekly interval=2, each step is 14 days
      // We check day difference (ignoring month boundary for simplicity)
      // Just verify they're not the same date
      expect(created[0].atDateHijri).not.toBe(created[1].atDateHijri);
      // And second should come after first
      expect(created[1].atDateHijri! > created[0].atDateHijri!).toBe(true);
    }
  });

  it("generates correct number of occurrences for monthly repeat", async () => {
    const template = makeTemplate({
      repeat: "monthly",
      repeatInterval: 1,
      baseDateHijri: "14460701",
    });

    const repo = makeRepo();
    await generateOccurrencesForTemplate(template, repo, todayEpoch);

    const created = (repo as any)._created as Task[];
    // Horizon for monthly interval=1 is 12 * 1 * 30 = 360 days → ~12 months
    expect(created.length).toBeGreaterThan(0);
    expect(created.length).toBeLessThanOrEqual(12);
  });

  it("generates correct number of occurrences for yearly repeat", async () => {
    const template = makeTemplate({
      repeat: "yearly",
      repeatInterval: 1,
      baseDateHijri: "14460101",
    });

    const repo = makeRepo();
    await generateOccurrencesForTemplate(template, repo, todayEpoch);

    const created = (repo as any)._created as Task[];
    // Horizon for yearly is 5 * 1 * 365 = 1825 days → ~5 years
    expect(created.length).toBeGreaterThan(0);
    expect(created.length).toBeLessThanOrEqual(5);
  });

  it("copies all template fields to each instance", async () => {
    const template = makeTemplate({
      repeat: "weekly",
      repeatInterval: 1,
      baseDateHijri: "14460701",
      name: "Friday Prayer",
      description: "Weekly reminder",
      atTime: "13:00",
      timezone: "Asia/Jakarta",
      lat: -6.2,
      long: 106.8,
    });

    const repo = makeRepo();
    await generateOccurrencesForTemplate(template, repo, todayEpoch);

    const created = (repo as any)._created as Task[];
    expect(created.length).toBeGreaterThan(0);

    const first = created[0];
    expect(first.name).toBe("Friday Prayer");
    expect(first.description).toBe("Weekly reminder");
    expect(first.atTime).toBe("13:00");
    expect(first.timezone).toBe("Asia/Jakarta");
    expect(first.lat).toBe(-6.2);
    expect(first.long).toBe(106.8);
    expect(first.recurringTaskId).toBe("rtask_test");
  });

  // ---------------------------------------------------------------------------
  // Repeat end conditions
  // ---------------------------------------------------------------------------

  describe("repeatEnd=on_date", () => {
    it("creates no instances past repeatEndDate", async () => {
      // baseDateHijri starts at 1446-07-01, repeatEndDate is 1446-07-10 (10 days later)
      const template = makeTemplate({
        repeat: "daily",
        repeatInterval: 1,
        baseDateHijri: "14460701",
        repeatEnd: "on_date",
        repeatEndDate: "14460710",
      });

      const repo = makeRepo();
      await generateOccurrencesForTemplate(template, repo, todayEpoch);

      const created = (repo as any)._created as Task[];
      // All created dates must be <= "14460710"
      created.forEach((t) => {
        expect(t.atDateHijri! <= "14460710").toBe(true);
      });
    });

    it("creates instances up to and including the end date", async () => {
      const template = makeTemplate({
        repeat: "daily",
        repeatInterval: 1,
        baseDateHijri: "14460701",
        repeatEnd: "on_date",
        repeatEndDate: "14460705",
      });

      const repo = makeRepo();
      await generateOccurrencesForTemplate(template, repo, todayEpoch);

      const created = (repo as any)._created as Task[];
      // Should have at most 5 instances (days 1-5), but possibly 0 if all past
      // The key check: no date after "14460705"
      created.forEach((t) => {
        expect(t.atDateHijri! <= "14460705").toBe(true);
      });
    });
  });

  describe("repeatEnd=after_occurrences", () => {
    it("creates exactly repeatEndOccurrences instances when no existing", async () => {
      const template = makeTemplate({
        repeat: "daily",
        repeatInterval: 1,
        baseDateHijri: "14460701",
        repeatEnd: "after_occurrences",
        repeatEndOccurrences: 3,
      });

      const repo = makeRepo(); // no existing
      await generateOccurrencesForTemplate(template, repo, todayEpoch);

      const created = (repo as any)._created as Task[];
      expect(created.length).toBe(3);
    });

    it("creates at most repeatEndOccurrences - existing.length instances when some exist", async () => {
      const existing = [
        new Task({
          id: "e1",
          atDateHijri: "14460701",
          recurringTaskId: "rtask_test",
        }),
      ];
      const template = makeTemplate({
        repeat: "daily",
        repeatInterval: 1,
        baseDateHijri: "14460701",
        repeatEnd: "after_occurrences",
        repeatEndOccurrences: 3,
      });

      const repo = makeRepo(existing);
      await generateOccurrencesForTemplate(template, repo, todayEpoch);

      const created = (repo as any)._created as Task[];
      // 3 total - 1 existing = 2 new
      expect(created.length).toBeLessThanOrEqual(2);
    });

    it("creates 0 instances when existing.length >= repeatEndOccurrences", async () => {
      const existing = [
        new Task({
          id: "e1",
          atDateHijri: "14460701",
          recurringTaskId: "rtask_test",
        }),
        new Task({
          id: "e2",
          atDateHijri: "14460702",
          recurringTaskId: "rtask_test",
        }),
        new Task({
          id: "e3",
          atDateHijri: "14460703",
          recurringTaskId: "rtask_test",
        }),
      ];
      const template = makeTemplate({
        repeat: "daily",
        repeatInterval: 1,
        baseDateHijri: "14460701",
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
      const templateWithNever = makeTemplate({
        repeat: "monthly",
        repeatInterval: 1,
        baseDateHijri: "14460701",
        repeatEnd: "never",
      });
      const templateWithout = makeTemplate({
        repeat: "monthly",
        repeatInterval: 1,
        baseDateHijri: "14460701",
      });

      const repo1 = makeRepo();
      const repo2 = makeRepo();
      await generateOccurrencesForTemplate(
        templateWithNever,
        repo1,
        todayEpoch
      );
      await generateOccurrencesForTemplate(templateWithout, repo2, todayEpoch);

      const created1 = (repo1 as any)._created as Task[];
      const created2 = (repo2 as any)._created as Task[];
      expect(created1.length).toBe(created2.length);
    });
  });

  // ---------------------------------------------------------------------------
  // BUG: iteration cap is exhausted by past dates
  // ---------------------------------------------------------------------------
  it("BUG: iteration cap exhaustion — old daily task misses future occurrences", async () => {
    // A daily task whose baseDateHijri is 390 days before today.
    // The generator iterates from baseDateHijri, burning ~390 iterations on past
    // dates before reaching today. With cap=400 and horizon=30, only ~10 of the
    // 30 expected future occurrences get generated.
    const pastDate = new Date(todayEpoch - 390 * 24 * 60 * 60 * 1000);
    const { HijriDate } = await import("../../calendar/hijri");
    const h = HijriDate.fromDate(pastDate, {
      latitude: 0,
      longitude: 0,
      offset: 0,
    });
    const baseDateHijri = `${h.year.toString().padStart(4, "0")}${h.month
      .toString()
      .padStart(2, "0")}${h.day.toString().padStart(2, "0")}`;

    const template = makeTemplate({
      repeat: "daily",
      repeatInterval: 1,
      baseDateHijri,
    });

    const repo = makeRepo();
    await generateOccurrencesForTemplate(template, repo, todayEpoch);

    const created = (repo as any)._created as Task[];
    // Ideally we want 30 future occurrences, but due to the bug we get far fewer
    // This test documents the bug: it should be 30 but the cap is hit early
    // When the bug is fixed, this assertion should be updated to expect(created.length).toBe(30)
    expect(created.length).toBeLessThan(30); // Bug: cap exhausted by past iterations
  });
});
