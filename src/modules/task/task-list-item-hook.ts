import { useTaskContext } from "./task-context";
import type { Task, TaskStatus } from "./types";
import { useHijriDate } from "../calendar/hijri";
import { usePouchDB } from "../../pouchdb";
import type { RecurringTask } from "./recurring-task";
import logger from "../logger";

export const useTaskListItem = () => {
  const { completeTask, reopenTask, setTrackerLogTask } = useTaskContext();
  const { db } = usePouchDB();

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
      const templateDoc = await db.get(task.recurringTaskId);
      const template = templateDoc as unknown as RecurringTask;
      if (template?.asTracker) {
        // This is a tracker task - open log modal instead of completing
        setTrackerLogTask({
          taskId: task.id as string,
          taskName: task.name || "",
          inputMode: template.inputMode || "toggle",
          unit: template.unit,
          recurringTaskId: task.recurringTaskId,
        });
        return true; // Handled as tracker
      }
    } catch (err) {
      logger.error("Failed to load recurring task template:", err);
      // Fall through to normal completion if template not found
    }
    return false; // Not a tracker
  };

  return {
    completeTask: completeTaskWithLog,
    reopenTask: reopenTaskWithLog,
    checkAndHandleTrackerTask,
  };
};
