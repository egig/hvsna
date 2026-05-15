import { describe, it, expect, vi } from "vitest";
import type { Task, PrayerTime } from "@/domain/task";

// Extract the grouping logic without React hooks
export function groupTasks(tasks: Task[], getToday: () => any) {
  const groups: {
    prayer: PrayerTime | null;
    tasks: Task[];
    isOverdue?: boolean;
  }[] = [];

  const today = getToday();
  const todayStart = today.startOfDay().toDate().valueOf();

  // Separate overdue tasks, prayer-based tasks, and regular tasks
  const overdueTasks = tasks.filter(
    (task) => task.atEpochMillis && task.atEpochMillis < todayStart
  );
  const prayerTasks = tasks.filter(
    (task) =>
      task.usePrayerTime &&
      task.prayerTime &&
      (!task.atEpochMillis || task.atEpochMillis >= todayStart)
  );
  const regularTasks = tasks.filter(
    (task) =>
      !task.usePrayerTime &&
      (!task.atEpochMillis || task.atEpochMillis >= todayStart)
  );

  // Add overdue tasks group first (always at top)
  if (overdueTasks.length > 0) {
    groups.push({
      prayer: null,
      tasks: overdueTasks.sort(
        (a, b) => (a.atEpochMillis || 0) - (b.atEpochMillis || 0)
      ),
      isOverdue: true,
    });
  }

  // Group prayer tasks by prayer time
  const prayerGroups: Record<PrayerTime, Task[]> = {
    Fajr: [],
    Sunrise: [],
    Dhuhr: [],
    Asr: [],
    Maghrib: [],
    Isha: [],
  };

  prayerTasks.forEach((task) => {
    if (task.prayerTime && prayerGroups[task.prayerTime]) {
      prayerGroups[task.prayerTime].push(task);
    }
  });

  // Add prayer groups in chronological order starting from Maghrib
  const prayerOrder: PrayerTime[] = [
    "Maghrib",
    "Isha",
    "Fajr",
    "Sunrise",
    "Dhuhr",
    "Asr",
  ];
  prayerOrder.forEach((prayer) => {
    if (prayerGroups[prayer].length > 0) {
      groups.push({
        prayer,
        tasks: prayerGroups[prayer].sort(
          (a, b) => (a.atEpochMillis || 0) - (b.atEpochMillis || 0)
        ),
      });
    }
  });

  // Add regular tasks at the end
  if (regularTasks.length > 0) {
    groups.push({
      prayer: null,
      tasks: regularTasks.sort(
        (a, b) => (a.atEpochMillis || 0) - (b.atEpochMillis || 0)
      ),
    });
  }

  return groups;
}

describe("Task Grouping Logic", () => {
  const mockGetToday = vi.fn(() => ({
    startOfDay: vi.fn().mockReturnValue({
      toDate: vi.fn().mockReturnValue(new Date("2026-02-24T00:00:00.000Z")),
    }),
  }));

  const mockTasks: Task[] = [
    {
      id: "task1",
      name: "Overdue Task",
      status: 0,
      atEpochMillis: new Date("2026-02-23T10:00:00.000Z").getTime(), // Yesterday
      usePrayerTime: false,
    },
    {
      id: "task2",
      name: "Today Task",
      status: 0,
      atEpochMillis: new Date("2026-02-24T10:00:00.000Z").getTime(), // Today
      usePrayerTime: false,
    },
    {
      id: "task3",
      name: "Prayer Task",
      status: 0,
      atEpochMillis: new Date("2026-02-24T13:00:00.000Z").getTime(), // Today
      usePrayerTime: true,
      prayerTime: "Dhuhr",
    },
  ] as Task[];

  it("should group overdue tasks separately at the top", () => {
    const groups = groupTasks(mockTasks, mockGetToday);

    expect(groups).toHaveLength(3); // Overdue, Prayer, Regular
    expect(groups[0].isOverdue).toBe(true);
    expect(groups[0].tasks).toHaveLength(1);
    expect(groups[0].tasks[0].name).toBe("Overdue Task");
  });

  it("should group prayer tasks correctly", () => {
    const groups = groupTasks(mockTasks, mockGetToday);

    const prayerGroup = groups.find((g) => g.prayer === "Dhuhr");
    expect(prayerGroup).toBeDefined();
    expect(prayerGroup?.tasks).toHaveLength(1);
    expect(prayerGroup?.tasks[0].name).toBe("Prayer Task");
  });

  it("should group regular tasks correctly", () => {
    const groups = groupTasks(mockTasks, mockGetToday);

    const regularGroup = groups.find((g) => g.prayer === null && !g.isOverdue);
    expect(regularGroup).toBeDefined();
    expect(regularGroup?.tasks).toHaveLength(1);
    expect(regularGroup?.tasks[0].name).toBe("Today Task");
  });

  it("should not show overdue group when no overdue tasks", () => {
    const tasksWithoutOverdue = mockTasks.filter(
      (task) => task.name !== "Overdue Task"
    );

    const groups = groupTasks(tasksWithoutOverdue, mockGetToday);

    expect(groups).toHaveLength(2); // Prayer, Regular
    expect(groups[0].isOverdue).toBeUndefined();
  });

  it("should sort tasks within each group by time", () => {
    const tasksWithMultiple: Task[] = [
      {
        id: "task1",
        name: "Overdue Task 1",
        status: 0,
        atEpochMillis: new Date("2026-02-23T15:00:00.000Z").getTime(),
        usePrayerTime: false,
      },
      {
        id: "task2",
        name: "Overdue Task 2",
        status: 0,
        atEpochMillis: new Date("2026-02-23T10:00:00.000Z").getTime(),
        usePrayerTime: false,
      },
    ] as Task[];

    const groups = groupTasks(tasksWithMultiple, mockGetToday);

    expect(groups[0].tasks).toHaveLength(2);
    expect(groups[0].tasks[0].name).toBe("Overdue Task 2"); // Earlier time first
    expect(groups[0].tasks[1].name).toBe("Overdue Task 1");
  });
});
