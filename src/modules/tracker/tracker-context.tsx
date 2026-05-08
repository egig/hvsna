import React, {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePouchDB } from "../../pouchdb";
import { createTrackerUseCases } from "../../usecases/tracker/TrackerUseCasesFactory";
import { queryKeys } from "../query-keys";
import { useHijriDate } from "../calendar/hijri/use-hijri-date";
import { ReminderService } from "../task/reminder-service";
import { useSettings } from "../settings/useSettings";
import { createTaskUseCases } from "../../usecases/task";
import logger from "../logger";

interface TrackerLogTask {
  taskId: string;
  taskName: string;
  inputMode: "toggle" | "add" | "set";
  unit?: string;
  trackerId: string;
}

interface TrackerContextType {
  // Tracker log modal state
  trackerLogTask: TrackerLogTask | null;
  setTrackerLogTask: (task: TrackerLogTask | null) => void;
  submitTrackerLog: (log: {
    value: number;
    note?: string;
    occurredAt: number;
  }) => Promise<void>;
}

const TrackerContext = createContext<TrackerContextType | undefined>(undefined);

export const TrackerProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const queryClient = useQueryClient();
  const { getToday } = useHijriDate();
  const { settings } = useSettings();
  const { db } = usePouchDB();
  const taskUseCases = createTaskUseCases(db);
  const trackerUseCases = createTrackerUseCases(db);

  // Tracker log modal state
  const [trackerLogTask, setTrackerLogTask] = useState<TrackerLogTask | null>(
    null
  );

  const invalidateTaskQueries = () => {
    const today = getToday();
    const todayString = today.toString();
    const tomorrowString = today.next().toString();

    queryClient.invalidateQueries({
      queryKey: queryKeys.todayTasks(todayString),
    });
    queryClient.invalidateQueries({
      queryKey: queryKeys.todayCompletedTasks(todayString),
    });
    queryClient.invalidateQueries({
      queryKey: queryKeys.upcomingTasks(tomorrowString),
    });
    queryClient.invalidateQueries({ queryKey: ["browsed-tasks"] });
    queryClient.invalidateQueries({ queryKey: queryKeys.unscheduledTasks() });
    queryClient.invalidateQueries({ queryKey: ["list-tasks"] });
    queryClient.invalidateQueries({ queryKey: queryKeys.allTasks() });
  };

  const submitTrackerLog = async (log: {
    value: number;
    note?: string;
    occurredAt: number;
  }) => {
    if (!trackerLogTask) return;

    try {
      // Create a TrackerLog entry using proper usecase
      await trackerUseCases.logValue(
        trackerLogTask.trackerId,
        log.value,
        log.note,
        log.occurredAt
      );

      // Update the task status to 2 (logged)
      const currentTask = await taskUseCases.getTaskById(trackerLogTask.taskId);
      if (currentTask) {
        const updatedTask = await taskUseCases.updateTask(
          trackerLogTask.taskId,
          {
            status: 2,
          }
        );
      } else {
        logger.error("Task not found for logging:", trackerLogTask.taskId);
      }

      // Cancel reminders for tracker tasks
      if (settings.notifications) {
        try {
          await ReminderService.cancelTaskReminders(trackerLogTask.taskId);
        } catch (error) {
          logger.error("Failed to cancel task reminders:", error);
        }
      }

      invalidateTaskQueries();
      setTrackerLogTask(null);
    } catch (error) {
      logger.error("Failed to submit tracker log:", error);
      throw error;
    }
  };

  const contextValue: TrackerContextType = {
    trackerLogTask,
    setTrackerLogTask,
    submitTrackerLog,
  };

  return (
    <TrackerContext.Provider value={contextValue}>
      {children}
    </TrackerContext.Provider>
  );
};

export const useTrackerContext = (): TrackerContextType => {
  const context = useContext(TrackerContext);
  if (!context) {
    throw new Error("useTrackerContext must be used within a TrackerProvider");
  }
  return context;
};
