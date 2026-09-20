import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import dayjs from "dayjs";
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useDndContext,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import type { Task } from "@/domain/task";
import { HvSquare } from "@/modules/icons";
import { usePrayerTimes } from "@/modules/prayer";
import { isPrayerBased } from "@/modules/prayer-time-utils";
import { useMockTime } from "@/modules/task/mock-time-context";
import { useLanguageContext } from "@/modules/i18n/LanguageContext";
import { useTaskContext } from "@/modules/task/task-context";
import { computeTimelineWindow, type TimelinePrayerMark } from "./timeline-window";
import {
  computeOverlapLayout,
  epochToTopPx,
  minutesToHeightPx,
  snapMinutesTo,
  MIN_BLOCK_HEIGHT_PX,
  SNAP_MINUTES,
  type TimelineBlockPlacement,
} from "./timeline-layout";
import {
  PrayerHairline,
  PrayerTaskBox,
  NoTimeTaskBox,
  NowHairline,
  NO_TIME_DROPPABLE_ID,
} from "./timeline-hairlines";
import { TimelineBlock } from "./timeline-block";

const TICK_INTERVAL_MS = 60_000;
const COLUMN_GAP_PX = 3;
const GUTTER_WIDTH_PX = 44;
const DEFAULT_DURATION_MINUTES = 15;
const GRID_DROPPABLE_ID = "timeline-grid";

interface TimelineViewProps {
  tasks: Task[];
  completedTasks: Task[];
  hourHeightPx: number;
  isAfterMaghrib: boolean;
}

export function TimelineView({
  tasks,
  completedTasks,
  hourHeightPx,
  isAfterMaghrib,
}: TimelineViewProps) {
  const { t } = useLanguageContext();
  const { now: getNow } = useMockTime();
  const { getPrayerTimesForDate } = usePrayerTimes();
  const { materializeVirtualTask, updateTask } = useTaskContext();
  const nowMarkerRef = useRef<HTMLDivElement>(null);
  const hasAutoScrolled = useRef(false);

  // Re-renders every 60s so the now-line advances while the screen stays open.
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), TICK_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { distance: 5 } })
  );

  const now = getNow();
  const pxPerMinute = hourHeightPx / 60;

  const { gridStartEpoch, gridEndEpoch, prayerMarks } = computeTimelineWindow(
    now,
    isAfterMaghrib,
    getPrayerTimesForDate
  );
  const gridHeightPx = ((gridEndEpoch - gridStartEpoch) / 60_000) * pxPerMinute;

  // Prayer-based tasks (`atTime` is a bare prayer name, e.g. "fajr") get an
  // atEpochMillis stamped at the *end* of that prayer's window (see
  // useTaskEpoch/getPrayerEndTime), not at the prayer's own instant — so
  // they're excluded from the epoch-positioned grid entirely and rendered
  // instead inside that prayer's PrayerTaskBox, grouped by name below.
  //
  // Every task here already has an atEpochMillis — the Timeline only ever
  // shows tasks that already have a date — but `atTime` can still be empty
  // (no specific clock time chosen). Those go in noTimeTasks instead of
  // rendering as a normal block at whatever epoch they carry.
  const gridBlocks = useMemo(
    () =>
      [...tasks, ...completedTasks].filter(
        (task) => task.atEpochMillis != null && !!task.atTime && !isPrayerBased(task)
      ),
    [tasks, completedTasks]
  );

  const noTimeTasks = useMemo(
    () => [...tasks, ...completedTasks].filter((task) => task.atEpochMillis != null && !task.atTime),
    [tasks, completedTasks]
  );

  const tasksByPrayer = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of [...tasks, ...completedTasks]) {
      if (task.atEpochMillis == null || !task.atTime || !isPrayerBased(task)) continue;
      const key = task.atTime!.toLowerCase();
      const group = map.get(key);
      if (group) group.push(task);
      else map.set(key, [task]);
    }
    return map;
  }, [tasks, completedTasks]);

  const layout = useMemo(
    () =>
      computeOverlapLayout(
        gridBlocks.map((task) => ({
          id: String(task.id),
          startEpoch: task.atEpochMillis as number,
          endEpoch:
            (task.atEpochMillis as number) +
            (task.durationMinutes ?? DEFAULT_DURATION_MINUTES) * 60_000,
        }))
      ),
    [gridBlocks]
  );

  const hourMarks = useMemo(() => {
    const marks: { epoch: number; label: string }[] = [];
    for (let epoch = gridStartEpoch; epoch < gridEndEpoch; epoch += 60 * 60_000) {
      marks.push({ epoch, label: dayjs(epoch).format("HH:mm") });
    }
    return marks;
  }, [gridStartEpoch, gridEndEpoch]);

  const nowVisible = now.valueOf() >= gridStartEpoch && now.valueOf() < gridEndEpoch;

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const task = event.active.data.current?.task as Task | undefined;
      if (!task || !event.over) return;

      if (event.over.id === NO_TIME_DROPPABLE_ID) {
        if (!task.atTime) return; // already has no time-of-day
        const activeTask = task.isVirtual ? await materializeVirtualTask(task) : task;
        // Clear the time-of-day only, keeping the task's date — mirrors the
        // task form's "no time" toggle (task-form-helpers.ts's getTaskEpoch),
        // which stamps end-of-day rather than nulling atEpochMillis outright.
        const endOfDayEpoch = dayjs(activeTask.atEpochMillis).endOf("day").valueOf();
        await updateTask(activeTask.id as string, {
          atEpochMillis: endOfDayEpoch,
          removeTime: true,
        });
        return;
      }

      if (event.over.id === GRID_DROPPABLE_ID) {
        const draggedRect = event.active.rect.current.translated ?? event.active.rect.current.initial;
        if (!draggedRect) return;

        const relativeTop = draggedRect.top - event.over.rect.top;
        const rawMinutes = relativeTop / pxPerMinute;
        const durationMinutes = task.durationMinutes ?? DEFAULT_DURATION_MINUTES;
        const windowMinutes = (gridEndEpoch - gridStartEpoch) / 60_000;
        const maxStartMinutes = Math.max(windowMinutes - durationMinutes, 0);
        const snappedMinutes = Math.min(
          snapMinutesTo(rawMinutes, SNAP_MINUTES, 0),
          maxStartMinutes
        );
        const newEpoch = gridStartEpoch + snappedMinutes * 60_000;
        if (newEpoch === task.atEpochMillis) return;

        const activeTask = task.isVirtual ? await materializeVirtualTask(task) : task;
        await updateTask(activeTask.id as string, {
          atEpochMillis: newEpoch,
          atTime: dayjs(newEpoch).format("HH:mm"),
        });
      }
    },
    [gridStartEpoch, gridEndEpoch, pxPerMinute, materializeVirtualTask, updateTask]
  );

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <TimelineGrid
        t={t}
        gridStartEpoch={gridStartEpoch}
        gridEndEpoch={gridEndEpoch}
        gridHeightPx={gridHeightPx}
        hourMarks={hourMarks}
        prayerMarks={prayerMarks}
        tasksByPrayer={tasksByPrayer}
        noTimeTasks={noTimeTasks}
        pxPerMinute={pxPerMinute}
        nowVisible={nowVisible}
        now={now}
        gridBlocks={gridBlocks}
        layout={layout}
        nowMarkerRef={nowMarkerRef}
        hasAutoScrolled={hasAutoScrolled}
      />

      {createPortal(
        <DragOverlay dropAnimation={null}>
          <TimelineDragPreview />
        </DragOverlay>,
        document.body
      )}
    </DndContext>
  );
}

/**
 * Visual-only clone rendered inside `DragOverlay`, sized to mirror the
 * source block/chip instead of floating as an unrelated small pill.
 *
 * Reads `activeNodeRect` from `useDndContext()` rather than measuring in
 * `onDragStart`: dnd-kit only populates `event.active.rect.current` via a
 * layout effect that runs *after* the `DragStart` action is dispatched, so
 * at the moment `onDragStart` fires it's still the stale value from before
 * this drag (null, for the very first drag) — gating render on that ref
 * left the overlay permanently empty. `activeNodeRect` is the same
 * reactively-measured rect dnd-kit's own `DragOverlay` uses to size its
 * `PositionedOverlay` wrapper, so it's guaranteed to be live by the time
 * this renders.
 *
 * Deliberately not `TimelineBlock` itself: that component calls
 * `useDraggable`, and mounting a second instance registered under the same
 * task id alongside the still-mounted source block would corrupt dnd-kit's
 * draggable-node registry.
 */
function TimelineDragPreview() {
  const { active, activeNodeRect } = useDndContext();
  const task = active?.data.current?.task as Task | undefined;
  if (!task || !activeNodeRect) return null;

  return (
    <div
      className="overflow-hidden rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-1.5 py-0.5 text-left shadow-lg"
      style={{ width: activeNodeRect.width, height: activeNodeRect.height }}
    >
      <div className="flex items-start gap-1.5 min-w-0 h-full">
        <HvSquare strokeWidth={1} size={14} className="shrink-0 text-gray-500" />
        <span className="truncate text-[11px] leading-tight text-gray-800 dark:text-gray-200">
          {task.name}
        </span>
      </div>
    </div>
  );
}

interface TimelineGridProps {
  t: (key: string) => string;
  gridStartEpoch: number;
  gridEndEpoch: number;
  gridHeightPx: number;
  hourMarks: { epoch: number; label: string }[];
  prayerMarks: TimelinePrayerMark[];
  tasksByPrayer: Map<string, Task[]>;
  noTimeTasks: Task[];
  pxPerMinute: number;
  nowVisible: boolean;
  now: Date;
  gridBlocks: Task[];
  layout: Map<string, TimelineBlockPlacement>;
  nowMarkerRef: React.RefObject<HTMLDivElement | null>;
  hasAutoScrolled: React.RefObject<boolean>;
}

/**
 * Renders the hour grid and owns its droppable zone.
 * Must be a genuine child of `<DndContext>` (not inlined into TimelineView,
 * which is the component that renders `<DndContext>` itself) — a component
 * can only see a Context Provider that wraps *its own* position in the
 * tree, never one it renders as its own descendant. Calling `useDroppable`
 * directly in TimelineView left the droppable permanently unregistered
 * (dnd-kit's `InternalContext` resolved to its default, provider-less
 * value), so every drop silently no-opped — this split is the fix.
 */
function TimelineGrid({
  t,
  gridStartEpoch,
  gridEndEpoch: _gridEndEpoch,
  gridHeightPx,
  hourMarks,
  prayerMarks,
  tasksByPrayer,
  noTimeTasks,
  pxPerMinute,
  nowVisible,
  now,
  gridBlocks,
  layout,
  nowMarkerRef,
  hasAutoScrolled,
}: TimelineGridProps) {
  const { setNodeRef: setGridRef } = useDroppable({ id: GRID_DROPPABLE_ID });

  // Center "now" in whichever ancestor actually scrolls (PageDesktop/
  // PageMobile's own page-level scroll container — Timeline renders in
  // normal page flow rather than owning a competing scroll region), once,
  // on mount.
  useEffect(() => {
    if (hasAutoScrolled.current || !nowVisible) return;
    hasAutoScrolled.current = true;
    nowMarkerRef.current?.scrollIntoView({ block: "center" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative">
      <NoTimeTaskBox label={t("end_of_day")} tasks={noTimeTasks} />

      <div className="relative flex mt-4" style={{ height: gridHeightPx }}>
        <div className="relative shrink-0" style={{ width: GUTTER_WIDTH_PX }}>
          {hourMarks.map((mark) => (
            <span
              key={mark.epoch}
              className="absolute right-2 -translate-y-1/2 text-[10px] text-gray-400 dark:text-gray-500"
              style={{ top: epochToTopPx(mark.epoch, gridStartEpoch, pxPerMinute) }}
            >
              {mark.label}
            </span>
          ))}
        </div>

        <div
          ref={setGridRef}
          className="relative flex-1 border-l border-gray-100 dark:border-gray-800"
        >
          {hourMarks.map((mark) => (
            <span
              key={mark.epoch}
              className="absolute left-0 right-0 border-t border-gray-100 dark:border-gray-800"
              style={{ top: epochToTopPx(mark.epoch, gridStartEpoch, pxPerMinute) }}
            />
          ))}

          {prayerMarks.map((mark) => {
            const key = `${mark.prayer}-${mark.date.valueOf()}`;
            const label = `${t(mark.prayer.toLowerCase())} ${dayjs(mark.date).format("hh:mm a")}`;
            const matchedTasks = tasksByPrayer.get(mark.prayer.toLowerCase());

            if (matchedTasks && matchedTasks.length > 0) {
              return (
                <PrayerTaskBox
                  key={key}
                  prayer={mark.prayer}
                  date={mark.date}
                  gridStartEpoch={gridStartEpoch}
                  pxPerMinute={pxPerMinute}
                  label={label}
                  tasks={matchedTasks}
                />
              );
            }

            return (
              <PrayerHairline
                key={key}
                prayer={mark.prayer}
                date={mark.date}
                gridStartEpoch={gridStartEpoch}
                pxPerMinute={pxPerMinute}
                label={label}
              />
            );
          })}

          {nowVisible && (
            <>
              <NowHairline
                epoch={now.valueOf()}
                gridStartEpoch={gridStartEpoch}
                pxPerMinute={pxPerMinute}
              />
              <div
                ref={nowMarkerRef}
                className="absolute left-0 w-px h-px"
                style={{ top: epochToTopPx(now.valueOf(), gridStartEpoch, pxPerMinute) }}
              />
            </>
          )}

          {gridBlocks.map((task) => {
            const placement = layout.get(String(task.id)) ?? { column: 0, columnCount: 1 };
            const height = minutesToHeightPx(
              task.durationMinutes ?? DEFAULT_DURATION_MINUTES,
              pxPerMinute,
              MIN_BLOCK_HEIGHT_PX
            );
            // `todayTasks`/`todayCompletedTasks` have no lower time bound
            // (an old overdue task, or — after the Maghrib re-anchor — a
            // task from earlier the same Gregorian day, both still count
            // as "today"), so a block's natural position can fall outside
            // the currently-rendered window. Clamp into the grid rather
            // than let it render at a wild negative/overflowing offset,
            // invisible and unreachable to click or drag.
            const rawTop = epochToTopPx(task.atEpochMillis as number, gridStartEpoch, pxPerMinute);
            const top = Math.min(Math.max(rawTop, 0), Math.max(gridHeightPx - height, 0));
            const widthPct = 100 / placement.columnCount;

            return (
              <TimelineBlock
                key={String(task.id)}
                task={task}
                pxPerMinute={pxPerMinute}
                style={{
                  top,
                  height,
                  left: `${placement.column * widthPct}%`,
                  width: `calc(${widthPct}% - ${COLUMN_GAP_PX}px)`,
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
