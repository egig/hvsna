import { Outlet, useLocation } from "react-router";
import { HvPlus } from "@/modules/icons";
import { TabBar } from "./modules/navigation/tab-bar";
import { useTaskContext } from "./modules/task/task-context";

export default function LayoutMobile() {
  const { openCreateTaskForm } = useTaskContext();
  const location = useLocation();

  return (
    <div className="h-[100dvh] flex flex-col">
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>

      {/* Task FAB */}
      {["today", "upcoming"].indexOf(location?.state?.context) != -1 && (
        <button
          onClick={() => openCreateTaskForm()}
          className="absolute bottom-[calc(var(--tab-bar-height)+1rem+env(safe-area-inset-bottom))] right-[1rem] w-14 h-14 bg-[var(--hvsna-primary-color)] hover:bg-[var(--hvsna-primary-color-hover)] active:bg-[var(--hvsna-primary-color-pressed)] text-white rounded-full shadow-lg flex items-center justify-center transition-colors z-50"
          aria-label="Add new task"
          data-testid="fab-add-task"
        >
          <HvPlus size={24} />
        </button>
      )}

      <div className="flex-shrink-0">
        <TabBar />
      </div>
    </div>
  );
}
