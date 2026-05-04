import { useState } from "react";
import { useNavigate } from "react-router";
import { DndContext, DragOverlay, useDraggable, useDroppable } from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  HvCalendar,
  HvLayoutList,
  HvCalendarMonth,
  HvCalendarMonthFilled,
  HvOutlineInbox,
  HvHiInbox,
  HvGripVertical,
  HvSearch,
  HvSquareRoundedPlusFilled,
} from "@/modules/icons";
import { Navbar } from "../navigation/navbar";
import { Page } from "../navigation";
import { PageTransition } from "../navigation/page-transition";
import { EmptyState } from "../components/empty-state";
import TaskListItem from "./task-list-item";
import { useUpcoming } from "./use-upcoming";
import { useInbox } from "./use-inbox";
import { useToday } from "./use-today";
import { WeekView } from "./week-view";
import { TodayContent } from "./today";
import type { Task } from "src/modules/task/types";
import { useLanguageContext } from "src/modules/i18n/LanguageContext";
import { useTaskContext } from "./task-context";
import { useScreenSize } from "../components/screen-size-wrapper";
import { useHijriDate } from "../calendar/hijri/use-hijri-date";
import { createPortal } from "react-dom";

type ViewMode = "list" | "week";
type MobileTab = "today" | "upcoming" | "inbox";

function UpcomingContent({
  upcomingTasks,
  taskGroupsWithLabels,
  isReady,
  effectiveMode,
  formatScheduledDate,
  handleEditTask,
  t,
  droppable,
}: {
  upcomingTasks: Task[];
  taskGroupsWithLabels: Record<string, { label: string; tasks: Task[] }>;
  isReady: boolean;
  effectiveMode: ViewMode;
  formatScheduledDate: (task: Task) => string;
  handleEditTask: (task: Task) => void;
  t: (key: string) => string;
  droppable?: boolean;
}) {
  return (
    <div className={isReady ? "visible" : "invisible"}>
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
            { key: "later", label: t("later") },
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
                      showDateTime
                      key={task.id}
                      task={task}
                      onEdit={handleEditTask}
                      formatDate={formatScheduledDate}
                    />
                  ))}
                </>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

function InboxContent({
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
              showDateTime={false}
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
          showDateTime={false}
          className="!border-b-0"
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

function TodayColumn({
  todayTasks,
  todayCompletedTasks,
  todayInitiated,
  todayError,
  handleEditTask,
  t,
}: {
  todayTasks: Task[];
  todayCompletedTasks: Task[];
  todayInitiated: boolean;
  todayError: string | null;
  handleEditTask: (task: Task) => void;
  t: (key: string) => string;
}) {
  const allTasks = [...todayTasks, ...todayCompletedTasks];

  return (
    <div className="flex-1 overflow-y-auto">
      {todayInitiated && todayError && (
        <div className="text-center py-4 px-2">
          <div className="text-red-600 text-sm">{`Error: ${todayError}`}</div>
        </div>
      )}
      {todayInitiated && allTasks.length === 0 ? (
        <EmptyState
          icon={<HvCalendar className="w-full h-full" />}
          title={t("no_tasks_scheduled_for_today")}
          description={t("tasks_scheduled_for_today_will_appear_here")}
        />
      ) : (
        <div className="space-y-2 p-2">
          {allTasks.map((task) => (
            <TaskListItem
              key={task.id}
              task={task}
              onEdit={handleEditTask}
              showGoalInfo={false}
              showDateTime={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Tasks() {
  const { t } = useLanguageContext();
  const { openEditTaskForm, updateTask, openCreateTaskForm } = useTaskContext();
  const { isDesktop } = useScreenSize();
  const { toHijriDate } = useHijriDate();

  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;
    const task =
      inboxTasks.find((t) => t.id === active.id) ??
      upcomingTasks.find((t) => t.id === active.id);
    if (!task) return;
    if (over.id === "inbox") {
      updateTask(task.id!, { atDateHijri: "" });
    } else {
      const [y, m, d] = (over.id as string).split("-").map(Number);
      const hijri = toHijriDate(new Date(y, m - 1, d));
      const atDateHijri =
        String(hijri.year).padStart(4, "0") +
        String(hijri.month).padStart(2, "0") +
        String(hijri.day).padStart(2, "0");
      updateTask(task.id!, { atDateHijri });
    }
  };

  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const stored = localStorage.getItem("upcoming-view-mode");
    return stored === "week" ? "week" : "list";
  });
  const [activeTab, setActiveTab] = useState<MobileTab>("today");

  const effectiveMode: ViewMode = isDesktop ? viewMode : "list";

  const toggleMode = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem("upcoming-view-mode", mode);
  };

  const {
    upcomingTasks,
    taskGroups,
    loading,
    initiated,
    error,
    formatScheduledDate,
  } = useUpcoming();

  const {
    inboxTasks,
    initiated: inboxInitiated,
  } = useInbox();

  const {
    todayTasks,
    todayCompletedTasks,
    initiated: todayInitiated,
    error: todayError,
  } = useToday();

  const taskGroupsWithLabels = {
    ...taskGroups,
    today: { ...taskGroups.today, label: t("today") },
    tomorrow: { ...taskGroups.tomorrow, label: t("tomorrow") },
    thisWeek: { ...taskGroups.thisWeek, label: t("this_week") },
    thisMonth: { ...taskGroups.thisMonth, label: t("this_month") },
    later: { ...taskGroups.later, label: t("later") },
    unscheduled: { ...taskGroups.unscheduled, label: t("unscheduled") },
  };

  const handleEditTask = (task: Task) => {
    openEditTaskForm(task.id as string);
  };

  const isReady = initiated && !loading && !error;
  const navigate = useNavigate();

  const navbarActions = isDesktop && (
    <div className="flex items-center gap-1">
      <button
        onClick={() => openCreateTaskForm()}
        title={t("add_new_task")}
        className="p-1.5 rounded-md text-[var(--hvsna-primary-color)] hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <HvSquareRoundedPlusFilled className="size-5" />
      </button>
      <button
        onClick={() => navigate("/search")}
        title={t("search")}
        className="p-1.5 rounded-md text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <HvSearch className="size-4" />
      </button>
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
    </div>
  );

  if (isDesktop) {
    return (
      <PageTransition>
        <DndContext
          onDragStart={(e) => {
            const task =
              inboxTasks.find((t) => t.id === e.active.id) ??
              upcomingTasks.find((t) => t.id === e.active.id);
            setActiveTask(task ?? null);
          }}
          onDragEnd={handleDragEnd}
        >
          <div className="flex flex-col h-full">
            {/* Single shared navbar */}
            <Navbar
              showBackButton={false}
              title={t("tasks")}
              rightAction={navbarActions}
            />

            {/* Content area */}
            <div className="flex-1 flex overflow-hidden">
              {/* 3-Column Layout for List View, 2-Column for Week View */}
              {effectiveMode === "list" ? (
                <>
                  {/* Today Column */}
                  <div className="w-1/3 flex flex-col overflow-hidden">
                    <div className="px-4 py-3 flex-shrink-0">
                      <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                        {t("today")}
                      </h2>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      <TodayColumn
                        todayTasks={todayTasks}
                        todayCompletedTasks={todayCompletedTasks}
                        todayInitiated={todayInitiated}
                        todayError={todayError}
                        handleEditTask={handleEditTask}
                        t={t}
                      />
                    </div>
                  </div>

                  {/* Upcoming Column */}
                  <div className="w-1/3 flex flex-col overflow-hidden">
                    <div className="px-4 py-3 flex-shrink-0">
                      <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                        {t("upcoming")}
                      </h2>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      {initiated && error && (
                        <div className="text-center py-8">
                          <div className="text-red-600 mb-4">{`Error: ${error}`}</div>
                        </div>
                      )}
                      <UpcomingContent
                        upcomingTasks={upcomingTasks}
                        taskGroupsWithLabels={taskGroupsWithLabels}
                        isReady={isReady}
                        effectiveMode="list"
                        formatScheduledDate={formatScheduledDate}
                        handleEditTask={handleEditTask}
                        t={t}
                        droppable={false}
                      />
                    </div>
                  </div>

                  {/* Inbox Column */}
                  <div className="w-1/3 flex flex-col overflow-hidden">
                    <div className="px-4 py-3 flex-shrink-0">
                      <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                        {t("inbox") || "Inbox"}
                      </h2>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      <DroppableInboxSidebar
                        inboxTasks={inboxTasks}
                        inboxInitiated={inboxInitiated}
                        handleEditTask={handleEditTask}
                        t={t}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Week View: Main content + Inbox sidebar */}
                  <div className="flex flex-col flex-1 overflow-hidden">
                    <div className="flex-1 overflow-y-auto">
                      <div className={effectiveMode === "week" ? "" : "max-w-2xl mx-auto w-full"}>
                        {initiated && error && (
                          <div className="text-center py-8">
                            <div className="text-red-600 mb-4">{`Error: ${error}`}</div>
                          </div>
                        )}
                        <UpcomingContent
                          upcomingTasks={upcomingTasks}
                          taskGroupsWithLabels={taskGroupsWithLabels}
                          isReady={isReady}
                          effectiveMode={effectiveMode}
                          formatScheduledDate={formatScheduledDate}
                          handleEditTask={handleEditTask}
                          t={t}
                          droppable
                        />
                      </div>
                    </div>
                  </div>

                  {/* Inbox sidebar */}
                  <div className="w-72 border-l border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden flex-shrink-0">
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-800">
                      <HvHiInbox className="size-4 text-gray-500 dark:text-gray-400" />
                      <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        {t("inbox") || "Inbox"}
                      </h2>
                    </div>
                    <DroppableInboxSidebar
                      inboxTasks={inboxTasks}
                      inboxInitiated={inboxInitiated}
                      handleEditTask={handleEditTask}
                      t={t}
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {createPortal(<DragOverlay>
            {activeTask && (
              <div className="rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg opacity-90 cursor-grabbing">
                <TaskListItem
                  task={activeTask}
                  onEdit={() => {}}
                  showGoalInfo={false}
                  showDateTime={false}
                />
              </div>
            )}
          </DragOverlay>, document.body)}
        </DndContext>
      </PageTransition>
    );
  }

  // Mobile: tabbed view
  const mobileTabs = (
    <div className="sticky top-0 z-10 flex border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <button
        onClick={() => setActiveTab("today")}
        className={[
          "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-colors border-b-2",
          activeTab === "today"
            ? "border-[var(--hvsna-primary-color)] text-[var(--hvsna-primary-color)]"
            : "border-transparent text-gray-500 dark:text-gray-400",
        ].join(" ")}
      >
        <HvCalendar className="size-4" />
        {t("today")}
      </button>
      <button
        onClick={() => setActiveTab("upcoming")}
        className={[
          "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-colors border-b-2",
          activeTab === "upcoming"
            ? "border-[var(--hvsna-primary-color)] text-[var(--hvsna-primary-color)]"
            : "border-transparent text-gray-500 dark:text-gray-400",
        ].join(" ")}
      >
        <HvCalendarMonth className="size-4" />
        {t("upcoming")}
      </button>
      <button
        onClick={() => setActiveTab("inbox")}
        className={[
          "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-colors border-b-2",
          activeTab === "inbox"
            ? "border-[var(--hvsna-primary-color)] text-[var(--hvsna-primary-color)]"
            : "border-transparent text-gray-500 dark:text-gray-400",
        ].join(" ")}
      >
        <HvOutlineInbox className="size-4" />
        {t("inbox") || "Unscheduled"}
      </button>
    </div>
  );

  return (
    <Page
      navbar={
        <Navbar
          showBackButton={false}
          title={t("tasks")}
          rightAction={navbarActions}
        />
      }
    >
      {mobileTabs}
      {activeTab === "today" && <TodayContent />}
      {initiated && error && activeTab === "upcoming" && (
        <div className="text-center py-8">
          <div className="text-red-600 mb-4">{`Error: ${error}`}</div>
        </div>
      )}
      {activeTab === "upcoming" && (
        <UpcomingContent
          upcomingTasks={upcomingTasks}
          taskGroupsWithLabels={taskGroupsWithLabels}
          isReady={isReady}
          effectiveMode="list"
          formatScheduledDate={formatScheduledDate}
          handleEditTask={handleEditTask}
          t={t}
        />
      )}
      {activeTab === "inbox" && (
        <InboxContent
          inboxTasks={inboxTasks}
          inboxInitiated={inboxInitiated}
          handleEditTask={handleEditTask}
          t={t}
        />
      )}
    </Page>
  );
}
