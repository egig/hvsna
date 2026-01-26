import { Block, BlockTitle, ListInput, List, ListButton } from "framework7-react";
import type { Task } from "~/lib/types/task";

interface TaskFormProps {
  editingTask: Task | null;
  taskName: string;
  onTaskNameChange: (value: string) => void;
  onSubmit: () => void;
}

export default function TaskForm({
  editingTask,
  taskName,
  onTaskNameChange,
  onSubmit,
}: TaskFormProps) {
  return (
    <Block>
      <BlockTitle color="primary">{editingTask ? "Edit Task" : "New Task"}</BlockTitle>
      <List strong dividers>
        <ListInput outline type="text" value={taskName} placeholder="Enter task name" onChange={(e: any) => onTaskNameChange(e.target.value)} />
        <ListButton color="primary" onClick={onSubmit}>{editingTask ? "UPDATE" : "CREATE"}</ListButton>
      </List>
    </Block>
  );
}
