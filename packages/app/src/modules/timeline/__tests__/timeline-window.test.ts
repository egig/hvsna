import { describe, expect, it } from "vitest";
import dayjs from "dayjs";
import type { PrayerTimes } from "adhan";
import { computeTimelineWindow } from "../timeline-window";

// Fixed, deterministic prayer times per calendar day — enough to exercise
// the window math without depending on the real `adhan` calculation.
function fakeGetPrayerTimesForDate(date: Date): PrayerTimes {
  const day = dayjs(date).startOf("day");
  return {
    fajr: day.add(5, "hour").toDate(),
    sunrise: day.add(6, "hour").toDate(),
    dhuhr: day.add(12, "hour").toDate(),
    asr: day.add(15, "hour").toDate(),
    maghrib: day.add(18, "hour").toDate(),
    isha: day.add(19, "hour").toDate(),
  } as PrayerTimes;
}

describe("computeTimelineWindow", () => {
  it("pre-Maghrib: spans midnight-to-midnight with all 6 same-day prayer marks", () => {
    const now = dayjs("2024-01-01T10:00:00").toDate();
    const window = computeTimelineWindow(now, false, fakeGetPrayerTimesForDate);

    expect(window.gridStartEpoch).toBe(dayjs("2024-01-01T00:00:00").valueOf());
    expect(window.gridEndEpoch).toBe(dayjs("2024-01-02T00:00:00").valueOf());
    expect(window.prayerMarks.map((m) => m.prayer)).toEqual([
      "Fajr",
      "Sunrise",
      "Dhuhr",
      "Asr",
      "Maghrib",
      "Isha",
    ]);
  });

  it("post-Maghrib: re-anchors to Maghrib(today)→Maghrib(tomorrow), replacing (not extending) the window", () => {
    const now = dayjs("2024-01-01T20:00:00").toDate();
    const window = computeTimelineWindow(now, true, fakeGetPrayerTimesForDate);

    expect(window.gridStartEpoch).toBe(dayjs("2024-01-01T18:00:00").valueOf());
    expect(window.gridEndEpoch).toBe(dayjs("2024-01-02T18:00:00").valueOf());
    // Tomorrow's Maghrib sits exactly on the window's own end boundary, so
    // it's excluded (end-exclusive) rather than double-counted as a mark.
    expect(window.prayerMarks.map((m) => m.prayer)).toEqual([
      "Isha",
      "Fajr",
      "Sunrise",
      "Dhuhr",
      "Asr",
    ]);
    // Isha mark is today's; the rest are tomorrow's.
    expect(window.prayerMarks[0].date).toEqual(dayjs("2024-01-01T19:00:00").toDate());
    expect(window.prayerMarks[1].date).toEqual(dayjs("2024-01-02T05:00:00").toDate());
  });

  it("boundary: the window is start-inclusive, end-exclusive", () => {
    // Exactly at today's Maghrib instant, already re-anchored.
    const now = dayjs("2024-01-01T18:00:00").toDate();
    const window = computeTimelineWindow(now, true, fakeGetPrayerTimesForDate);

    // Tomorrow's Maghrib is the grid's own end boundary, not a listed mark.
    expect(window.prayerMarks.some((m) => m.prayer === "Maghrib" && m.date.valueOf() === window.gridEndEpoch)).toBe(false);
    // Today's Isha sits inside the window, right after its start.
    expect(window.prayerMarks[0].date.valueOf()).toBeGreaterThanOrEqual(window.gridStartEpoch);
  });

  it("falls back to a plain midnight-anchored window with no marks when prayer times can't be computed", () => {
    const now = dayjs("2024-01-01T10:00:00").toDate();
    const window = computeTimelineWindow(now, false, () => {
      throw new Error("no location set");
    });

    expect(window.gridStartEpoch).toBe(dayjs("2024-01-01T00:00:00").valueOf());
    expect(window.gridEndEpoch).toBe(dayjs("2024-01-02T00:00:00").valueOf());
    expect(window.prayerMarks).toEqual([]);
  });
});
