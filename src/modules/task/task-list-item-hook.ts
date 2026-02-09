import { useLog } from "../log/use-log";
import { useGoal } from "../goal/use-goal";
import { useTaskStore } from "./task-store";
import type { Task, TaskStatus } from "../../lib/types/task";

export const useTaskListItem = () => {
  const getTask = useTaskStore((s) => s.getTask);
  const updateTask = useTaskStore((s) => s.updateTask);
  const { createLog } = useLog();
  const { getGoal } = useGoal();

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
    const updatedTask = await updateTask(id, {
      status,
    });

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

  return {
    updateStatus,
  };
};
