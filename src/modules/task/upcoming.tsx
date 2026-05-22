import { useCallback, useEffect, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  HvCalendar,
  HvLayoutList,
  HvCalendarMonth,
  HvOutlineInbox,
  HvHiInbox,
  HvGripVertical,
} from "@/modules/icons";
import { Navbar } from "../navigation/navbar";
import { Page } from "../navigation";
import { PageTransition } from "../navigation/page-transition";
import { EmptyState } from "../components/empty-state";
import TaskListItem from "./task-list-item";
import { useUpcoming } from "./use-upcoming";
import { useUnscheduled } from "./use-unscheduled";
import { WeekView } from "./week-view";
import type { Task } from "@/domain/task";
import type { LaterGroup } from "./use-upcoming";
import { useLanguageContext } from "src/modules/i18n/LanguageContext";
import { useTaskContext } from "./task-context";
import { useScreenSize } from "../components/screen-size-wrapper";
import { useHijriDate } from "../calendar/hijri/use-hijri-date";
import { createPortal } from "react-dom";

type ViewMode = "list" | "week";

function ScheduledContent({
  upcomingTasks,
  taskGroupsWithLabels,
  laterGroups,
  effectiveMode,
  handleEditTask,
  t,
  droppable,
  onLoadMore,
  canLoadMore,
  isLoadingMore,
}: {
  upcomingTasks: Task[];
  taskGroupsWithLabels: Record<string, { label: string; tasks: Task[] }>;
  laterGroups: LaterGroup[];
  isReady: boolean;
  effectiveMode: ViewMode;
  handleEditTask: (task: Task) => void;
  t: (key: string) => string;
  droppable?: boolean;
  onLoadMore: () => void;
  canLoadMore: boolean;
  isLoadingMore: boolean;
}) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const isLoadingMoreRef = useRef(isLoadingMore);
  useEffect(() => { isLoadingMoreRef.current = isLoadingMore; }, [isLoadingMore]);

  const hasItems = upcomingTasks.length > 0;
  useEffect(() => {
    if (!canLoadMore || !sentinelRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isLoadingMoreRef.current) onLoadMore();
      },
      { rootMargin: "200px" }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [canLoadMore, onLoadMore, hasItems]);

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
            .map(({ key, label }) => (
              <div key={key}>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 m-3">
                  {taskGroupsWithLabels[key].label || label}
                </h3>
                <>
                  {taskGroupsWithLabels[key].tasks.map((task: Task) => (
                    <TaskListItem
                      key={task.id}
                      task={task}
                      onEdit={handleEditTask}
                    />
                  ))}
                </>
              </div>
            ))}
          {laterGroups
            .filter((g) => g.tasks.length > 0)
            .map((group) => (
              <div key={group.key}>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 m-3">
                  {group.label}
                </h3>
                <>
                  {group.tasks.map((task: Task) => (
                    <TaskListItem
                      key={task.id}
                      task={task}
                      onEdit={handleEditTask}
                    />
                  ))}
                </>
              </div>
            ))}
          <div ref={sentinelRef} className="h-1" aria-hidden />
          {isLoadingMore && (
            <div className="flex justify-center py-4 text-sm text-gray-400">
              {"Loading…"}
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
  handleEditTask,
  t,
}: {
  inboxTasks: Task[];
  inboxInitiated: boolean;
  handleEditTask: (task: Task) => void;
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
            <TaskListItem
              key={task.id}
              task={task}
              onEdit={handleEditTask}
              showGoalInfo={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DraggableInboxItem({
  task,
  onEdit,
}: {
  task: Task;
  onEdit: (task: Task) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: task.id! });

  return (
    <div
      ref={setNodeRef}
      style={
        transform
          ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
          : undefined
      }
      className={[
        "flex items-stretch rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden",
        isDragging ? "opacity-40" : "",
      ].join(" ")}
    >
      <div
        {...listeners}
        {...attributes}
        className="flex items-center px-1 cursor-grab active:cursor-grabbing text-gray-300 dark:text-gray-600 hover:text-gray-400 dark:hover:text-gray-500 shrink-0 touch-none"
      >
        <HvGripVertical className="size-3" />
      </div>
      <div className="flex-1 min-w-0">
        <TaskListItem
          task={task}
          onEdit={onEdit}
          showGoalInfo={false}
          className="!border-b-0"
          disableSwipe
        />
      </div>
    </div>
  );
}

function DroppableInboxSidebar({
  inboxTasks,
  inboxInitiated,
  handleEditTask,
  t,
}: {
  inboxTasks: Task[];
  inboxInitiated: boolean;
  handleEditTask: (task: Task) => void;
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
              <DraggableInboxItem
                key={task.id}
                task={task}
                onEdit={handleEditTask}
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
  const { openEditTaskForm, updateTask } = useTaskContext();
  const { isDesktop } = useScreenSize();
  const { toHijriDate } = useHijriDate();

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
      updateTask(task.id!, { atEpochMillis: null });
    } else {
      const [y, m, d] = (over.id as string).split("-").map(Number);
      const hijri = toHijriDate(new Date(y, m - 1, d));
      const atEpochMillis = hijri.endOfDay().toDate().valueOf();
      updateTask(task.id!, { atEpochMillis });
    }
  };

  const [mobileTab, setMobileTab] = useState<"scheduled" | "unscheduled">(
    "scheduled"
  );

  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const stored = localStorage.getItem("upcoming-view-mode");
    return stored === "week" ? "week" : "list";
  });

  const effectiveMode: ViewMode = isDesktop ? viewMode : "list";

  const toggleMode = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem("upcoming-view-mode", mode);
  };

  const { upcomingTasks, taskGroups, loading, isLoadingMore, initiated, error } =
    useUpcoming(horizonDays);

  const { inboxTasks: unscheduledTasks, initiated: inboxInitiated } =
    useUnscheduled();

  const taskGroupsWithLabels = {
    today: { ...taskGroups.today, label: t("today") },
    tomorrow: { ...taskGroups.tomorrow, label: t("tomorrow") },
    thisWeek: { ...taskGroups.thisWeek, label: t("this_week") },
    thisMonth: { ...taskGroups.thisMonth, label: t("this_month") },
    unscheduled: { ...taskGroups.unscheduled, label: t("unscheduled") },
  };

  const handleEditTask = (task: Task) => {
    openEditTaskForm(task.id as string, task.isVirtual ? task : undefined);
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
        </div>
      )}
    </div>
  );

  if (isDesktop) {
    return (
      <PageTransition>
        <DndContext
          onDragStart={(e) => {
            const task =
              unscheduledTasks.find((t) => t.id === e.active.id) ??
              upcomingTasks.find((t) => t.id === e.active.id);
            setActiveTask(task ?? null);
          }}
          onDragEnd={handleDragEnd}
        >
          <div className="flex flex-col h-full">
            {/* Split header row: main title + sidebar header at same level */}
            <div className="flex shrink-0 border-b border-gray-200 dark:border-gray-800">
              <div className="flex-1 flex items-center justify-between px-4 py-3">
                <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                  {t("upcoming")}
                </h1>
                {navbarActions}
              </div>
              <div className="w-72 border-l border-gray-200 dark:border-gray-800 flex items-center gap-2 px-4 py-3 shrink-0">
                <HvHiInbox className="size-4 text-gray-500 dark:text-gray-400" />
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {t("unscheduled") || "Unscheduled"}
                </h2>
              </div>
            </div>

            {/* Content area: always two columns on desktop */}
            <div className="flex-1 flex overflow-hidden min-h-0">
              {/* Main scheduled content */}
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
                    handleEditTask={handleEditTask}
                    t={t}
                    droppable={effectiveMode === "week"}
                    onLoadMore={handleLoadMore}
                    canLoadMore={canLoadMore}
                    isLoadingMore={isLoadingMore}
                  />
                </div>
              </div>

              {/* Inbox sidebar - always visible */}
              <div className="w-72 border-l border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden flex-shrink-0">
                {effectiveMode === "week" ? (
                  <DroppableInboxSidebar
                    inboxTasks={unscheduledTasks}
                    inboxInitiated={inboxInitiated}
                    handleEditTask={handleEditTask}
                    t={t}
                  />
                ) : (
                  <div className="flex-1 overflow-y-auto">
                    {inboxInitiated &&
                      (unscheduledTasks.length === 0 ? (
                        <EmptyState
                          icon={<HvOutlineInbox className="w-full h-full" />}
                          title={t("no_tasks_in_inbox")}
                          description={t(
                            "tasks_without_schedule_or_list_will_appear_here"
                          )}
                        />
                      ) : (
                        <div className="space-y-2 p-2">
                          {unscheduledTasks.map((task) => (
                            <TaskListItem
                              key={task.id}
                              task={task}
                              onEdit={handleEditTask}
                              showGoalInfo={false}
                            />
                          ))}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {createPortal(
            <DragOverlay>
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
      </PageTransition>
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
            handleEditTask={handleEditTask}
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
          handleEditTask={handleEditTask}
          t={t}
        />
      )}
    </Page>
  );
}
