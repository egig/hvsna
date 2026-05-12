import { useTaskContext } from "./task-context";

export const useTaskListItem = () => {
  const { completeTask, reopenTask } = useTaskContext();
  return {
    completeTask: completeTask,
    reopenTask: reopenTask,
  };
};
