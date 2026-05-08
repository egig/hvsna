import { useTaskContext } from "./task-context";
import type { Task, TaskStatus } from "./types";
import { useHijriDate } from "../calendar/hijri";
import { usePouchDB } from "../../pouchdb";
import { useTrackers } from "../tracker/useTrackers";
import logger from "../logger";

export const useTaskListItem = () => {
  const { completeTask, reopenTask, setTrackerLogTask } = useTaskContext();
  const { db } = usePouchDB();
  const { getTracker } = useTrackers();

  const completeTaskWithLog = async (id: string): Promise<Task> => {
    // Get the current task before updating to check status change
    const currentTask = await completeTask(id);
    return currentTask;
  };

  const reopenTaskWithLog = async (id: string): Promise<Task> => {
    // Get the current task before updating to check status change
    const currentTask = await reopenTask(id);
    return currentTask;
  };

  const checkAndHandleTrackerTask = async (task: Task): Promise<boolean> => {
    if (!task.recurringTaskId) {
      return false;
    }

    try {
      const tracker = await getTracker(task.recurringTaskId);
      if (tracker) {
        // This is a tracker task - open log modal instead of completing
        setTrackerLogTask({
          taskId: task.id as string,
          taskName: task.name || "",
          inputMode: tracker.inputMode || "toggle",
          unit: tracker.unit,
          recurringTaskId: task.recurringTaskId,
        });
        return true; // Handled as tracker
      }
    } catch (err) {
      logger.error("Failed to load tracker template:", err);
      // Fall through to normal completion if tracker not found
    }
    return false; // Not a tracker
  };

  return {
    completeTask: completeTaskWithLog,
    reopenTask: reopenTaskWithLog,
    checkAndHandleTrackerTask,
  };
};
