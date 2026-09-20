import { useState } from "react";
import { HvClock, HvLayoutList } from "@/modules/icons";

export type TodayViewMode = "list" | "timeline";

const STORAGE_KEY = "today-view-mode";

export function useTodayViewMode() {
  const [mode, setMode] = useState<TodayViewMode>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "list" ? "list" : "timeline";
  });

  const toggleMode = (next: TodayViewMode) => {
    setMode(next);
    localStorage.setItem(STORAGE_KEY, next);
  };

  return { mode, toggleMode };
}

interface TodayViewModeToggleProps {
  mode: TodayViewMode;
  toggleMode: (mode: TodayViewMode) => void;
}

/** List/Timeline segmented toggle — same interaction pattern as Upcoming's List/Week toggle. */
export function TodayViewModeToggle({ mode, toggleMode }: TodayViewModeToggleProps) {
  return (
    <div className="flex gap-0.5">
      <button
        onClick={() => toggleMode("list")}
        title="List view"
        className={[
          "p-1.5 rounded-md transition-colors",
          mode === "list"
            ? "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100"
            : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300",
        ].join(" ")}
      >
        <HvLayoutList className="size-5" />
      </button>
      <button
        onClick={() => toggleMode("timeline")}
        title="Timeline view"
        className={[
          "p-1.5 rounded-md transition-colors",
          mode === "timeline"
            ? "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100"
            : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300",
        ].join(" ")}
      >
        <HvClock className="size-5" />
      </button>
    </div>
  );
}
