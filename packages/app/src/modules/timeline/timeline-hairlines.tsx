import type { ComponentType } from "react";
import { useDroppable } from "@dnd-kit/core";
import type { PrayerTime, Task } from "@/domain/task";
import { HvAsr, HvDhuhr, HvFajr, HvIsha, HvMaghrib, HvSunrise } from "@/modules/icons";
import { epochToTopPx } from "./timeline-layout";
import { TimelineBlock } from "./timeline-block";

export const NO_TIME_DROPPABLE_ID = "timeline-no-time";

const PRAYER_ICONS: Record<PrayerTime, ComponentType<{ size?: number }>> = {
  Fajr: HvFajr,
  Sunrise: HvSunrise,
  Dhuhr: HvDhuhr,
  Asr: HvAsr,
  Maghrib: HvMaghrib,
  Isha: HvIsha,
};

interface PrayerHairlineProps {
  prayer: PrayerTime;
  date: Date;
  gridStartEpoch: number;
  pxPerMinute: number;
  label: string;
}

/** Full-width hairline, styled like the existing SunsetHairline. Sunrise (not an actual prayer) is muted. */
export function PrayerHairline({
  prayer,
  date,
  gridStartEpoch,
  pxPerMinute,
  label,
}: PrayerHairlineProps) {
  const Icon = PRAYER_ICONS[prayer];
  const muted = prayer === "Sunrise";
  const top = epochToTopPx(date.valueOf(), gridStartEpoch, pxPerMinute);

  return (
    <div
      className="absolute left-0 right-0 flex items-center gap-2 px-2"
      style={{ top, transform: "translateY(-50%)" }}
    >
      <span
        className={`flex-1 h-px ${muted ? "bg-gray-100 dark:bg-gray-800" : "bg-gray-200 dark:bg-gray-700"}`}
      />
      <span
        className={`inline-flex items-center gap-1 text-[10px] font-bold whitespace-nowrap ${
          muted ? "text-gray-400 dark:text-gray-500" : "text-[#dd7d5f]"
        }`}
      >
        <Icon size={muted ? 13 : 15} />
        {label}
      </span>
      <span
        className={`flex-1 h-px ${muted ? "bg-gray-100 dark:bg-gray-800" : "bg-gray-200 dark:bg-gray-700"}`}
      />
    </div>
  );
}

interface PrayerTaskBoxProps {
  prayer: PrayerTime;
  date: Date;
  gridStartEpoch: number;
  pxPerMinute: number;
  label: string;
  tasks: Task[];
}

/**
 * Replaces `PrayerHairline` for a prayer that has task(s) scheduled on it
 * (`task.atTime` is that prayer's bare name — see `isPrayerBased`): an
 * accent-bordered box anchored at the same top pixel the hairline would use,
 * listing each matched task as an interactive `TimelineBlock` row. Absolute
 * overlay like the hairline it replaces — the grid doesn't reflow to make
 * room, so a box with many rows can visually overlap nearby content.
 */
export function PrayerTaskBox({
  prayer,
  date,
  gridStartEpoch,
  pxPerMinute,
  label,
  tasks,
}: PrayerTaskBoxProps) {
  const Icon = PRAYER_ICONS[prayer];
  const top = epochToTopPx(date.valueOf(), gridStartEpoch, pxPerMinute);

  return (
    <div
      className="absolute left-2 right-2 z-20 overflow-hidden rounded-md border border-[#dd7d5f]/50 bg-white dark:bg-gray-900"
      style={{ top }}
    >
      <div className="flex items-center gap-1 border-b border-[#dd7d5f]/30 px-2 py-1 text-[10px] font-bold whitespace-nowrap text-[#dd7d5f]">
        <Icon size={15} />
        {label}
      </div>
      <div className="px-0.5 py-0.5">
        {tasks.map((task) => (
          <TimelineBlock key={String(task.id)} task={task} variant="row" />
        ))}
      </div>
    </div>
  );
}

interface NoTimeTaskBoxProps {
  label: string;
  tasks: Task[];
}

/**
 * Tasks with an atEpochMillis (the Timeline is always day-scoped, so every
 * task shown has one) but no atTime. Pinned to the top of the day's grid
 * (sticky, above the hour rows) rather than scattered as individual blocks
 * at whatever end-of-day epoch they happen to carry — and itself a drop
 * target: dropping a scheduled `TimelineBlock` here clears its time-of-day
 * while keeping the task's date (see timeline-view.tsx's handleDragEnd).
 */
export function NoTimeTaskBox({ label, tasks }: NoTimeTaskBoxProps) {
  const { setNodeRef, isOver } = useDroppable({ id: NO_TIME_DROPPABLE_ID });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[30px] z-20 mx-2 mt-2 overflow-hidden transition-colors ml-[44px] ${
        isOver
          ? "border-primary-300 dark:border-primary-700 bg-primary-50 dark:bg-primary-950/40"
          : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900"
      }`}
    >
      {tasks.length > 0 && (
        <div className="px-0.5 py-0.5">
          {tasks.map((task) => (
            <TimelineBlock key={String(task.id)} task={task} variant="row" />
          ))}
        </div>
      )}
    </div>
  );
}

interface NowHairlineProps {
  epoch: number;
  gridStartEpoch: number;
  pxPerMinute: number;
}

/** Live "now" indicator — distinct red line + dot, re-rendered on each 60s tick by the caller. */
export function NowHairline({ epoch, gridStartEpoch, pxPerMinute }: NowHairlineProps) {
  const top = epochToTopPx(epoch, gridStartEpoch, pxPerMinute);
  return (
    <div
      className="absolute left-0 right-0 flex items-center z-10 pointer-events-none"
      style={{ top, transform: "translateY(-50%)" }}
    >
      <span className="w-2 h-2 rounded-full bg-red-500 -ml-1 shrink-0" />
      <span className="flex-1 h-px bg-red-500" />
    </div>
  );
}
