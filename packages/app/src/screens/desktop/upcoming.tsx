import { useCallback, useRef, useState } from "react";
import { DndContext } from "@dnd-kit/core";
import { Allotment, LayoutPriority, type AllotmentHandle } from "allotment";
import type { Task } from "@/domain/task";
import {
  HvLayoutList,
  HvCalendarMonth,
  HvHiInbox,
  HvPanelLeftClose,
} from "@/modules/icons";
import {
  useUpcomingData,
  ScheduledContent,
  DroppableInboxSidebar,
  DragOverlayPortal,
  type ViewMode,
} from "@/modules/task/upcoming-shared";
import { SidebarToggleButton } from "./sidebar-context";

export default function UpcomingDesktop() {
  const {
    t,
    canLoadMore,
    handleLoadMore,
    activeTask,
    setActiveTask,
    upcomingTasks,
    taskGroupsWithLabels,
    laterGroups,
    isLoadingMore,
    unscheduledTasks,
    inboxInitiated,
    handleDragEnd,
    sensors,
  } = useUpcomingData();

  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const stored = localStorage.getItem("upcoming-view-mode");
    return stored === "week" ? "week" : "list";
  });

  const allotmentRef = useRef<AllotmentHandle>(null);
  // Inbox sidebar defaults to collapsed; expand state persists to localStorage.
  const [inboxCollapsed, setInboxCollapsed] = useState(
    () => localStorage.getItem("upcoming-inbox-collapsed") !== "false",
  );

  const persistInboxCollapsed = (collapsed: boolean) => {
    localStorage.setItem("upcoming-inbox-collapsed", String(collapsed));
  };

  const handleToggleInbox = useCallback(() => {
    const newCollapsed = !inboxCollapsed;
    setInboxCollapsed(newCollapsed);
    persistInboxCollapsed(newCollapsed);
    const newSize = newCollapsed ? 0 : 288;
    const mainSize = window.innerWidth - newSize;
    allotmentRef.current?.resize([mainSize, newSize]);
  }, [inboxCollapsed]);

  const handleAllotmentChange = useCallback((sizes: number[]) => {
    const collapsed = sizes[1] < 40;
    setInboxCollapsed(collapsed);
    persistInboxCollapsed(collapsed);
  }, []);

  const effectiveMode: ViewMode = viewMode;

  const toggleMode = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem("upcoming-view-mode", mode);
  };

  const navbarActions = (
    <div className="flex items-center gap-1">
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
    </div>
  );

  return (
    <DndContext
      sensors={sensors}
      onDragStart={(e) => {
        const task =
          unscheduledTasks.find((t) => t.id === e.active.id) ??
          upcomingTasks.find((t) => t.id === e.active.id) ??
          (e.active.data.current?.task as Task | undefined);
        setActiveTask(task ?? null);
      }}
      onDragEnd={handleDragEnd}
    >
      <Allotment
        ref={allotmentRef}
        className="h-full"
        proportionalLayout={false}
        defaultSizes={[window.innerWidth, inboxCollapsed ? 0 : 288]}
        onChange={handleAllotmentChange}
      >
        {/* Main pane */}
        <Allotment.Pane minSize={400} priority={LayoutPriority.High}>
          <div className="flex flex-col h-full">
            <div className="shrink-0 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2 min-w-0">
                <SidebarToggleButton className="flex-shrink-0 self-start -ml-1" />
                <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                  {t("upcoming")}
                </h1>
              </div>
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
                <ScheduledContent
                  upcomingTasks={upcomingTasks}
                  taskGroupsWithLabels={taskGroupsWithLabels}
                  laterGroups={laterGroups}
                  isReady={true}
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

      <DragOverlayPortal activeTask={activeTask} />
    </DndContext>
  );
}
