import dayjs from "dayjs";
import type { PrayerTimes } from "adhan";
import type { PrayerTime } from "@/domain/task";

export interface TimelinePrayerMark {
  prayer: PrayerTime;
  date: Date;
}

export interface TimelineWindow {
  gridStartEpoch: number;
  gridEndEpoch: number;
  prayerMarks: TimelinePrayerMark[];
}

const DAY_MS = 24 * 60 * 60 * 1000;
const PRAYER_ORDER: PrayerTime[] = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"];
const TOMORROW_MORNING_PRAYERS: PrayerTime[] = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib"];

function prayerInstants(pt: PrayerTimes): Record<PrayerTime, Date> {
  return {
    Fajr: pt.fajr,
    Sunrise: pt.sunrise,
    Dhuhr: pt.dhuhr,
    Asr: pt.asr,
    Maghrib: pt.maghrib,
    Isha: pt.isha,
  };
}

/**
 * Computes the Timeline grid's time window and the prayer instants that
 * fall inside it. Distinct from `use-today.ts`'s `taskEndEpoch`, which only
 * ever extends the task-inclusion window's *end* boundary forward after
 * Maghrib — this grid window *replaces* both boundaries: before Maghrib it's
 * midnight(today)→midnight(tomorrow); after Maghrib it re-anchors to
 * Maghrib(today)→Maghrib(tomorrow), mirroring the Hijri day rollover.
 *
 * Falls back to a plain midnight-anchored window with no prayer marks if
 * prayer times can't be computed (e.g. no location set yet) — same
 * no-location fallback behavior as `use-today.ts`.
 */
export function computeTimelineWindow(
  now: Date,
  isAfterMaghrib: boolean,
  getPrayerTimesForDate: (date: Date) => PrayerTimes
): TimelineWindow {
  const today = dayjs(now);
  let gridStartEpoch: number;
  let gridEndEpoch: number;
  let marks: TimelinePrayerMark[] = [];

  try {
    const todayInstants = prayerInstants(getPrayerTimesForDate(now));

    if (!isAfterMaghrib) {
      gridStartEpoch = today.startOf("day").valueOf();
      gridEndEpoch = gridStartEpoch + DAY_MS;
      marks = PRAYER_ORDER.map((prayer) => ({ prayer, date: todayInstants[prayer] }));
    } else {
      const tomorrowInstants = prayerInstants(
        getPrayerTimesForDate(today.add(1, "day").toDate())
      );
      gridStartEpoch = todayInstants.Maghrib.valueOf();
      gridEndEpoch = tomorrowInstants.Maghrib.valueOf();
      marks = [
        { prayer: "Isha", date: todayInstants.Isha },
        ...TOMORROW_MORNING_PRAYERS.map((prayer) => ({
          prayer,
          date: tomorrowInstants[prayer],
        })),
      ];
    }
  } catch {
    gridStartEpoch = today.startOf("day").valueOf();
    gridEndEpoch = gridStartEpoch + DAY_MS;
  }

  const prayerMarks = marks.filter(
    (m) => m.date.valueOf() >= gridStartEpoch && m.date.valueOf() < gridEndEpoch
  );

  return { gridStartEpoch, gridEndEpoch, prayerMarks };
}
