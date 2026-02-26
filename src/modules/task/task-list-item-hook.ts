import { useLog } from "../log/use-log";
import { useGoal } from "../goal/use-goal";
import { useTaskStore } from "./task-store";
import type { Task, TaskStatus } from "./types";
import { useHijriDate } from "../calendar/hijri";

export const useTaskListItem = () => {
  const getTask = useTaskStore((s) => s.getTask);
  const updateTask = useTaskStore((s) => s.updateTask);
  const completeTask = useTaskStore((s) => s.completeTask);
  const reopenTask = useTaskStore((s) => s.reopenTask);
  const refreshAllTaskLists = useTaskStore((s) => s.refreshAllTaskLists);
  const { createLog } = useLog();
  const { getGoal } = useGoal();
  const { getToday } = useHijriDate();

  const updateStatus = async (
    id: string,
    status: TaskStatus,
  ): Promise<Task> => {
    // Get the current task before updating to check status change
    const currentTask = await getTask(id);
    if (!currentTask) {
      throw new Error("updating not existing task: " + id);
    }

    // Update the task
    const updatedTask = await updateTask(
      id,
      {
        status,
      },
      () => {
        refreshAllTaskLists(getToday());
      },
    );

    if (!updatedTask.targetId) {
      return updatedTask;
    }

    if (status === currentTask.status) {
      return updatedTask;
    }

    if (status === 0) {
      return updatedTask;
    }

    try {
      const goal = await getGoal(updatedTask.targetId as string);
      let v = updatedTask.targetValue || 0;
      if (status !== 1) {
        v = -1 * v;
      }

      await createLog({
        trackerId: goal.trackerId,
        timestamp: Date.now(),
        value: v,
        taskId: updatedTask.id,
        attributes: updatedTask.attributes,
      });
    } catch (logError) {
      // Log creation failure shouldn't break task update
      console.warn("Failed to create log for task status change:", logError);
    }

    return updatedTask;
  };

  const completeTaskWithLog = async (id: string): Promise<Task> => {
    // Get the current task before updating to check status change
    const currentTask = await getTask(id);
    if (!currentTask) {
      throw new Error("completing not existing task: " + id);
    }

    // Complete the task
    const updatedTask = await completeTask(id, () => {
      refreshAllTaskLists(getToday());
    });

    if (!updatedTask.targetId) {
      return updatedTask;
    }

    if (currentTask.status === 1) {
      return updatedTask; // Already completed
    }

    try {
      const goal = await getGoal(updatedTask.targetId as string);
      const v = updatedTask.targetValue || 0;

      await createLog({
        trackerId: goal.trackerId,
        timestamp: Date.now(),
        value: v,
        taskId: updatedTask.id,
        attributes: updatedTask.attributes,
      });
    } catch (logError) {
      // Log creation failure shouldn't break task update
      console.warn("Failed to create log for task completion:", logError);
    }

    return updatedTask;
  };

  const reopenTaskWithLog = async (id: string): Promise<Task> => {
    // Get the current task before updating to check status change
    const currentTask = await getTask(id);
    if (!currentTask) {
      throw new Error("reopening not existing task: " + id);
    }

    // Reopen the task
    const updatedTask = await reopenTask(id, () => {
      refreshAllTaskLists(getToday());
    });

    if (!updatedTask.targetId) {
      return updatedTask;
    }

    if (currentTask.status === 0) {
      return updatedTask; // Already pending
    }

    try {
      const goal = await getGoal(updatedTask.targetId as string);
      let v = updatedTask.targetValue || 0;
      v = -1 * v; // Negative value for reopening

      await createLog({
        trackerId: goal.trackerId,
        timestamp: Date.now(),
        value: v,
        taskId: updatedTask.id,
        attributes: updatedTask.attributes,
      });
    } catch (logError) {
      // Log creation failure shouldn't break task update
      console.warn("Failed to create log for task reopening:", logError);
    }

    return updatedTask;
  };

  return {
    updateStatus,
    completeTask: completeTaskWithLog,
    reopenTask: reopenTaskWithLog,
  };
};
