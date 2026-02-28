import { useLog } from "../log/use-log";
import { useGoal } from "../goal/use-goal";
import { useTaskContext } from "./task-context";
import type { Task, TaskStatus } from "./types";
import { useHijriDate } from "../calendar/hijri";

export const useTaskListItem = () => {
  const { completeTask, reopenTask } = useTaskContext();

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

  return {
    completeTask: completeTaskWithLog,
    reopenTask: reopenTaskWithLog,
  };
};
