import { useTaskContext } from "./task-context";
import type { Task } from "./types";

export const useTaskListItem = () => {
  const { completeTask, reopenTask } = useTaskContext();

  const completeTaskWithLog = async (id: string): Promise<Task> => {
    const currentTask = await completeTask(id);
    return currentTask;
  };

  const reopenTaskWithLog = async (id: string): Promise<Task> => {
    const currentTask = await reopenTask(id);
    return currentTask;
  };

  return {
    completeTask: completeTaskWithLog,
    reopenTask: reopenTaskWithLog,
  };
};
