import { useCallback, useEffect, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Allotment, LayoutPriority, type AllotmentHandle } from "allotment";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  HvCalendar,
  HvLayoutList,
  HvCalendarMonth,
  HvOutlineInbox,
  HvHiInbox,
  HvGripVertical,
  HvPanelLeft,
  HvPanelLeftClose,
} from "@/modules/icons";
import { Navbar } from "../navigation/navbar";
import { Page } from "../navigation";
import { PageTransition } from "../navigation/page-transition";
import { EmptyState } from "../components/empty-state";
import TaskListItem from "./task-list-item";
import { TaskGroupCollapsible } from "./task-group-collapsible";
import { useUpcoming } from "./use-upcoming";
import { useUnscheduled } from "./use-unscheduled";
import { WeekView } from "./week-view";
import type { Task } from "@/domain/task";
import type { LaterGroup } from "./use-upcoming";
import { useLanguageContext } from "src/modules/i18n/LanguageContext";
import { useTaskContext } from "./task-context";
import { useScreenSize } from "../components/screen-size-wrapper";
import dayjs from "dayjs";
import { createPortal } from "react-dom";

type ViewMode = "list" | "week";

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

function DroppableGroup({
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

function ScheduledContent({
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
          icon={<HvCalendar className="w-full h-full" />}
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

function UnscheduledContent({
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
        "group relative flex items-stretch rounded bg-white border-b border-gray-200 dark:bg-gray-900 overflow-hidden cursor-grab active:cursor-grabbing transition-all hover:shadow-sm",
        isDragging ? "opacity-40" : "",
      ].join(" ")}
    >
      <div className="absolute left-0 top-0 bottom-0 z-50 flex items-center px-1 text-gray-300 dark:text-gray-600 group-hover:text-gray-400 dark:group-hover:text-gray-500 shrink-0 touch-none opacity-0 group-hover:opacity-100 transition-opacity">
        <HvGripVertical className="size-3" />
      </div>
      <div className="flex-1 min-w-0">
        <TaskListItem
          task={task}
          showGoalInfo={showGoalInfo}
          className={className}
          disableSwipe
        />
      </div>
    </div>
  );
}

function DroppableInboxSidebar({
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

const HORIZON_INITIAL = 30;
const HORIZON_INCREMENT = 30;
const HORIZON_MAX = 365;

export default function Upcoming() {
  const { t } = useLanguageContext();
  const { updateTask } = useTaskContext();
  const { isDesktop } = useScreenSize();

  const [horizonDays, setHorizonDays] = useState(HORIZON_INITIAL);
  const canLoadMore = horizonDays < HORIZON_MAX;
  const handleLoadMore = useCallback(() => {
    setHorizonDays((prev) => Math.min(prev + HORIZON_INCREMENT, HORIZON_MAX));
  }, []);

  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;
    const task =
      unscheduledTasks.find((t) => t.id === active.id) ??
      upcomingTasks.find((t) => t.id === active.id);
    if (!task) return;
    if (over.id === "inbox") {
      updateTask(task.id!, { atEpochMillis: null, atTime: "" });
    } else {
      const [y, m, d] = (over.id as string).split("-").map(Number);
      const atEpochMillis = dayjs(new Date(y, m - 1, d))
        .endOf("day")
        .valueOf();
      updateTask(task.id!, { atEpochMillis, atTime: "" });
    }
  };

  const [mobileTab, setMobileTab] = useState<"scheduled" | "unscheduled">(
    "scheduled"
  );

  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const stored = localStorage.getItem("upcoming-view-mode");
    return stored === "week" ? "week" : "list";
  });

  const allotmentRef = useRef<AllotmentHandle>(null);
  const [inboxCollapsed, setInboxCollapsed] = useState(false);

  const handleToggleInbox = useCallback(() => {
    const newCollapsed = !inboxCollapsed;
    setInboxCollapsed(newCollapsed);
    const newSize = newCollapsed ? 0 : 288;
    const mainSize = window.innerWidth - newSize;
    allotmentRef.current?.resize([mainSize, newSize]);
  }, [inboxCollapsed]);

  const handleAllotmentChange = useCallback((sizes: number[]) => {
    setInboxCollapsed(sizes[1] < 40);
  }, []);

  const effectiveMode: ViewMode = isDesktop ? viewMode : "list";

  const toggleMode = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem("upcoming-view-mode", mode);
  };

  const {
    upcomingTasks,
    taskGroups,
    loading,
    isLoadingMore,
    initiated,
    error,
  } = useUpcoming(horizonDays);

  useEffect(() => {
    if (!initiated || isLoadingMore || !canLoadMore) return;
    const scheduledCount = upcomingTasks.filter(
      (t) => !!t.atEpochMillis
    ).length;
    if (scheduledCount < 10) handleLoadMore();
  }, [initiated, isLoadingMore, canLoadMore, upcomingTasks, handleLoadMore]);

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

  const navbarActions = (
    <div className="flex items-center gap-1">
      {isDesktop && (
        <div className="flex gap-0.5">
          <button
            onClick={() => toggleMode("list")}
            title="List view"
            className={[
              "p-1.5 rounded-md transition-colors",
              effectiveMode === "list"
                ? "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300",
            ].join(" ")}
          >
            <HvLayoutList className="size-4" />
          </button>
          <button
            onClick={() => toggleMode("week")}
            title="Week view"
            className={[
              "p-1.5 rounded-md transition-colors",
              effectiveMode === "week"
                ? "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300",
            ].join(" ")}
          >
            <HvCalendarMonth className="size-4" />
          </button>
          {inboxCollapsed && (
            <button
              onClick={handleToggleInbox}
              className="p-1.5 rounded-md text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title={inboxCollapsed ? "Show inbox" : "Hide inbox"}
            >
              <HvHiInbox className="size-4 -scale-x-100" />
            </button>
          )}
        </div>
      )}
    </div>
  );

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

  if (isDesktop) {
    return (
      <DndContext
        sensors={sensors}
        onDragStart={(e) => {
          const task =
            unscheduledTasks.find((t) => t.id === e.active.id) ??
            upcomingTasks.find((t) => t.id === e.active.id);
          setActiveTask(task ?? null);
        }}
        onDragEnd={handleDragEnd}
      >
        <Allotment
          ref={allotmentRef}
          proportionalLayout={false}
          onChange={handleAllotmentChange}
        >
          {/* Main pane */}
          <Allotment.Pane minSize={400} priority={LayoutPriority.High}>
            <div className="flex flex-col h-full">
              <div className="shrink-0 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 py-3">
                <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                  {t("upcoming")}
                </h1>
                {navbarActions}
              </div>
              <div
                className={
                  effectiveMode === "week"
                    ? "flex-1 flex flex-col min-h-0 overflow-hidden"
                    : "flex-1 overflow-y-auto"
                }
              >
                <div
                  className={
                    effectiveMode === "week"
                      ? "flex-1 flex flex-col min-h-0"
                      : "max-w-2xl mx-auto w-full"
                  }
                >
                  {initiated && error && (
                    <div className="text-center py-8">
                      <div className="text-red-600 mb-4">{`Error: ${error}`}</div>
                    </div>
                  )}
                  <ScheduledContent
                    upcomingTasks={upcomingTasks}
                    taskGroupsWithLabels={taskGroupsWithLabels}
                    laterGroups={taskGroups.laterGroups}
                    isReady={isReady}
                    effectiveMode={effectiveMode}
                    t={t}
                    droppable={effectiveMode === "week"}
                    droppableGroups={effectiveMode === "list"}
                    onLoadMore={handleLoadMore}
                    canLoadMore={canLoadMore}
                    isLoadingMore={isLoadingMore}
                  />
                </div>
              </div>
            </div>
          </Allotment.Pane>

          {/* Inbox pane */}
          <Allotment.Pane preferredSize={288} minSize={0} snap>
            <div className="flex flex-col h-full border-l border-gray-200 dark:border-gray-800">
              <div className="flex justify-between shrink-0 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2 px-4 py-3">
                <div className="flex-1 flex justify-items-center items-center gap-1">
                  <HvHiInbox className="size-4 text-gray-500 dark:text-gray-400" />
                  <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {t("unscheduled") || "Unscheduled"}
                  </h2>
                </div>
                {inboxCollapsed || (
                  <button
                    onClick={handleToggleInbox}
                    className="p-1.5 rounded-md text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    title={inboxCollapsed ? "Show inbox" : "Hide inbox"}
                  >
                    <HvPanelLeftClose className="size-4 -scale-x-100" />
                  </button>
                )}
              </div>
              {!inboxCollapsed && (
                <div className="flex-1 overflow-hidden flex flex-col">
                  <DroppableInboxSidebar
                    inboxTasks={unscheduledTasks}
                    inboxInitiated={inboxInitiated}
                    t={t}
                  />
                </div>
              )}
            </div>
          </Allotment.Pane>
        </Allotment>

        {createPortal(
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
          </DragOverlay>,
          document.body
        )}
      </DndContext>
    );
  }

  return (
    <Page
      navbar={
        <Navbar
          showBackButton={false}
          title={t("upcoming")}
          rightAction={navbarActions}
        />
      }
    >
      {/* Mobile tab bar */}
      <div className="flex border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-950 z-20">
        <button
          onClick={() => setMobileTab("scheduled")}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
            mobileTab === "scheduled"
              ? "text-primary-600 border-b-2 border-primary-500"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          {t("scheduled") || "Scheduled"}
        </button>
        <button
          onClick={() => setMobileTab("unscheduled")}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
            mobileTab === "unscheduled"
              ? "text-primary-600 border-b-2 border-primary-500"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          {t("unscheduled") || "Unscheduled"}
        </button>
      </div>

      {mobileTab === "scheduled" ? (
        <>
          {initiated && error && (
            <div className="text-center py-8">
              <div className="text-red-600 mb-4">{`Error: ${error}`}</div>
            </div>
          )}
          <ScheduledContent
            upcomingTasks={upcomingTasks}
            taskGroupsWithLabels={taskGroupsWithLabels}
            laterGroups={taskGroups.laterGroups}
            isReady={isReady}
            effectiveMode="list"
            t={t}
            onLoadMore={handleLoadMore}
            canLoadMore={canLoadMore}
            isLoadingMore={isLoadingMore}
          />
        </>
      ) : (
        <UnscheduledContent
          inboxTasks={unscheduledTasks}
          inboxInitiated={inboxInitiated}
          t={t}
        />
      )}
    </Page>
  );
}
