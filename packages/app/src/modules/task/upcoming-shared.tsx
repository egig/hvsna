import { useCallback, useEffect, useRef, useState } from "react";
import {
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { HvOutlineInbox } from "@/modules/icons";
import { EmptyState } from "../components/empty-state";
import TaskListItem from "./task-list-item";
import { TaskGroupCollapsible } from "./task-group-collapsible";
import { useUpcoming } from "./use-upcoming";
import { useUnscheduled } from "./use-unscheduled";
import { WeekView } from "../../screens/desktop/week-view";
import type { Task } from "@/domain/task";
import type { LaterGroup } from "./use-upcoming";
import { useLanguageContext } from "src/modules/i18n/LanguageContext";
import { useTaskContext } from "./task-context";
import dayjs from "dayjs";
import { createPortal } from "react-dom";

export type ViewMode = "list" | "week";

export const HORIZON_INITIAL = 30;
export const HORIZON_INCREMENT = 30;
export const HORIZON_MAX = 365;

function dropIdForGroup(key: string): string {
  if (key === "today") return dayjs().format("YYYY-MM-DD");
  if (key === "tomorrow") return dayjs().add(1, "day").format("YYYY-MM-DD");
  if (key === "thisWeek") return dayjs().endOf("week").format("YYYY-MM-DD");
  if (key === "thisMonth") return dayjs().endOf("month").format("YYYY-MM-DD");
  const monthMatch = key.match(/^month_(\d+)_(\d+)$/);
  if (monthMatch) {
    const [, year, month] = monthMatch;
    return dayjs(`${year}-${month.padStart(2, "0")}-01`)
      .endOf("month")
      .format("YYYY-MM-DD");
  }
  const yearMatch = key.match(/^year_(\d+)$/);
  if (yearMatch) return `${yearMatch[1]}-12-31`;
  return dayjs().endOf("month").format("YYYY-MM-DD");
}

export function DroppableGroup({
  id,
  label,
  tasks,
}: {
  id: string;
  label: string;
  tasks: Task[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <TaskGroupCollapsible
      label={
        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
          {label}
        </span>
      }
      containerRef={setNodeRef}
      containerClassName={[
        "rounded transition-colors p-2",
        isOver
          ? "bg-amber-50 dark:bg-amber-950/20 ring-1 ring-inset ring-amber-200 dark:ring-amber-800"
          : "",
      ].join(" ")}
    >
      {tasks.map((task) => (
        <DraggableTaskItem key={task.id} task={task} />
      ))}
    </TaskGroupCollapsible>
  );
}

export function ScheduledContent({
  upcomingTasks,
  taskGroupsWithLabels,
  laterGroups,
  effectiveMode,
  t,
  droppable,
  droppableGroups,
  onLoadMore,
  canLoadMore,
  isLoadingMore,
}: {
  upcomingTasks: Task[];
  taskGroupsWithLabels: Record<string, { label: string; tasks: Task[] }>;
  laterGroups: LaterGroup[];
  isReady: boolean;
  effectiveMode: ViewMode;
  t: (key: string) => string;
  droppable?: boolean;
  droppableGroups?: boolean;
  onLoadMore: () => void;
  canLoadMore: boolean;
  isLoadingMore: boolean;
}) {
  const isLoadingMoreRef = useRef(isLoadingMore);
  useEffect(() => {
    isLoadingMoreRef.current = isLoadingMore;
  }, [isLoadingMore]);

  return (
    <>
      {effectiveMode === "week" ? (
        <WeekView upcomingTasks={upcomingTasks} droppable={droppable} />
      ) : upcomingTasks.length === 0 ? (
        <EmptyState
          icon={<HvOutlineInbox className="w-full h-full" />}
          title={t("no_upcoming_tasks")}
          description={t("all_tasks_completed_or_no_pending")}
        />
      ) : (
        <div className="space-y-6">
          {[
            { key: "today", label: t("today") },
            { key: "tomorrow", label: t("tomorrow") },
            { key: "thisWeek", label: t("this_week") },
            { key: "thisMonth", label: t("this_month") },
          ]
            .filter(
              ({ key }) =>
                taskGroupsWithLabels[key] &&
                taskGroupsWithLabels[key].tasks.length > 0
            )
            .map(({ key, label }) =>
              droppableGroups ? (
                <DroppableGroup
                  key={key}
                  id={dropIdForGroup(key)}
                  label={taskGroupsWithLabels[key].label || label}
                  tasks={taskGroupsWithLabels[key].tasks}
                />
              ) : (
                <TaskGroupCollapsible
                  key={key}
                  label={
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                      {taskGroupsWithLabels[key].label || label}
                    </span>
                  }
                >
                  {taskGroupsWithLabels[key].tasks.map((task: Task) => (
                    <TaskListItem key={task.id} task={task} />
                  ))}
                </TaskGroupCollapsible>
              )
            )}
          {laterGroups
            .filter((g) => g.tasks.length > 0)
            .map((group) =>
              droppableGroups ? (
                <DroppableGroup
                  key={group.key}
                  id={dropIdForGroup(group.key)}
                  label={group.label}
                  tasks={group.tasks}
                />
              ) : (
                <TaskGroupCollapsible
                  key={group.key}
                  label={
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                      {group.label}
                    </span>
                  }
                >
                  {group.tasks.map((task: Task) => (
                    <TaskListItem key={task.id} task={task} />
                  ))}
                </TaskGroupCollapsible>
              )
            )}
          {isLoadingMore && (
            <div className="flex justify-center py-4 text-sm text-gray-400">
              {"Loading…"}
            </div>
          )}
          {canLoadMore && isLoadingMore && (
            <div className="flex justify-center mb-8">
              <button
                className="p-2 font-bold text-gray-500"
                onClick={onLoadMore}
              >
                {t("load_more")}
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export function UnscheduledContent({
  inboxTasks,
  inboxInitiated,
  t,
}: {
  inboxTasks: Task[];
  inboxInitiated: boolean;
  t: (key: string) => string;
}) {
  return (
    <div className={inboxInitiated ? "visible" : "invisible"}>
      {inboxTasks.length === 0 ? (
        <EmptyState
          icon={<HvOutlineInbox className="w-full h-full" />}
          title={t("no_tasks_in_inbox")}
          description={t("tasks_without_schedule_or_list_will_appear_here")}
        />
      ) : (
        <div className="space-y-2">
          {inboxTasks.map((task: Task) => (
            <TaskListItem key={task.id} task={task} showGoalInfo={false} />
          ))}
        </div>
      )}
    </div>
  );
}

function DraggableTaskItem({
  task,
  showGoalInfo,
  className,
}: {
  task: Task;
  showGoalInfo?: boolean;
  className?: string;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id!,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={[
        "group relative rounded bg-white border-b border-gray-200 dark:bg-gray-900 overflow-hidden cursor-grab transition-all hover:shadow-sm",
        isDragging ? "opacity-40" : "",
      ].join(" ")}
    >
      <TaskListItem
        task={task}
        showGoalInfo={showGoalInfo}
        className={className}
      />
    </div>
  );
}

export function DroppableInboxSidebar({
  inboxTasks,
  inboxInitiated,
  t,
}: {
  inboxTasks: Task[];
  inboxInitiated: boolean;
  t: (key: string) => string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: "inbox" });

  return (
    <div
      ref={setNodeRef}
      className={[
        "flex-1 overflow-y-auto transition-colors rounded",
        isOver
          ? "bg-amber-50 dark:bg-amber-950/20 ring-1 ring-inset ring-amber-200 dark:ring-amber-800"
          : "",
      ].join(" ")}
    >
      {inboxInitiated &&
        (inboxTasks.length === 0 ? (
          <EmptyState
            icon={<HvOutlineInbox className="w-full h-full" />}
            title={t("no_tasks_in_inbox")}
            description={t("tasks_without_schedule_or_list_will_appear_here")}
          />
        ) : (
          <div className="space-y-2 p-2">
            {inboxTasks.map((task) => (
              <DraggableTaskItem
                key={task.id}
                task={task}
                showGoalInfo={false}
                className="!border-b-0"
              />
            ))}
          </div>
        ))}
    </div>
  );
}

export function useUpcomingData() {
  const { t } = useLanguageContext();
  const { updateTask } = useTaskContext();

  const [horizonDays, setHorizonDays] = useState(HORIZON_INITIAL);
  const canLoadMore = horizonDays < HORIZON_MAX;
  const handleLoadMore = useCallback(() => {
    setHorizonDays((prev) => Math.min(prev + HORIZON_INCREMENT, HORIZON_MAX));
  }, []);

  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const {
    upcomingTasks,
    taskGroups,
    loading,
    isLoadingMore,
    initiated,
    error,
  } = useUpcoming(horizonDays);

  const { inboxTasks: unscheduledTasks, initiated: inboxInitiated } =
    useUnscheduled();

  const taskGroupsWithLabels = {
    today: { ...taskGroups.today, label: t("today") },
    tomorrow: { ...taskGroups.tomorrow, label: t("tomorrow") },
    thisWeek: { ...taskGroups.thisWeek, label: t("this_week") },
    thisMonth: { ...taskGroups.thisMonth, label: t("this_month") },
    unscheduled: { ...taskGroups.unscheduled, label: t("unscheduled") },
  };

  const isReady = initiated && !loading && !error;

  useEffect(() => {
    if (!initiated || isLoadingMore || !canLoadMore) return;
    const scheduledCount = upcomingTasks.filter(
      (t) => !!t.atEpochMillis
    ).length;
    if (scheduledCount < 10) handleLoadMore();
  }, [initiated, isLoadingMore, canLoadMore, upcomingTasks, handleLoadMore]);

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;
    const task =
      unscheduledTasks.find((t) => t.id === active.id) ??
      upcomingTasks.find((t) => t.id === active.id) ??
      (active.data.current?.task as Task | undefined);
    // Week view can show tasks outside the loaded horizon (past weeks, weeks
    // beyond the horizon) that aren't in `upcomingTasks` — fall back to the
    // drag id, which is the task id. Virtual recurring occurrences (`vtask_*`)
    // have no persisted row and can't be rescheduled this way.
    const taskId = task?.id ?? active.id;
    if (typeof taskId === "string" && taskId.startsWith("vtask_")) return;
    if (over.id === "inbox") {
      updateTask(taskId, { atEpochMillis: null, atTime: "" });
    } else {
      const [y, m, d] = (over.id as string).split("-").map(Number);
      const atEpochMillis = dayjs(new Date(y, m - 1, d))
        .endOf("day")
        .valueOf();
      updateTask(taskId, { atEpochMillis, atTime: "" });
    }
  };

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  return {
    t,
    horizonDays,
    canLoadMore,
    handleLoadMore,
    activeTask,
    setActiveTask,
    upcomingTasks,
    taskGroups,
    taskGroupsWithLabels,
    laterGroups: taskGroups.laterGroups,
    loading,
    isLoadingMore,
    initiated,
    error,
    isReady,
    unscheduledTasks,
    inboxInitiated,
    handleDragEnd,
    sensors,
  };
}

export function DragOverlayContent({
  activeTask,
}: {
  activeTask: Task | null;
}) {
  // Force the grabbing cursor everywhere while a drag is in progress — child
  // elements set their own `cursor-pointer`, so a body-level style isn't enough.
  useEffect(() => {
    if (!activeTask) return;
    const style = document.createElement("style");
    style.textContent = "*{cursor:grabbing !important;}";
    document.head.appendChild(style);
    return () => {
      style.remove();
    };
  }, [activeTask]);

  return (
    <DragOverlay dropAnimation={null}>
      {activeTask && (
        <div className="rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg opacity-90 cursor-grabbing">
          <TaskListItem
            task={activeTask}
            onEdit={() => {}}
            showGoalInfo={false}
          />
        </div>
      )}
    </DragOverlay>
  );
}

export function DragOverlayPortal({ activeTask }: { activeTask: Task | null }) {
  return createPortal(
    <DragOverlayContent activeTask={activeTask} />,
    document.body
  );
}
