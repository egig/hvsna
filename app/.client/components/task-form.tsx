import { useState, useEffect } from "react";
import { Block, BlockTitle, ListInput, List, ListButton, Preloader } from "framework7-react";
import { useTask } from "../hooks/use-task";
import type { Task } from "~/lib/types/task";

interface TaskFormProps {
  taskId?: string | null;
  onSuccess?: (task: Task) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
}

export default function TaskForm({
  taskId,
  onSuccess,
  onError,
  onCancel,
}: TaskFormProps) {
  const { task, loading, error, createTask, updateTask, getTask, reset } = useTask();
  const [taskName, setTaskName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (taskId) {
      getTask(taskId).then(fetchedTask => {
        if (fetchedTask) {
          setTaskName(fetchedTask.name);
        }
      });
    } else {
      setTaskName('');
    }
  }, [taskId, getTask]);

  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  const handleSubmit = async () => {
    if (!taskName.trim()) return;

    try {
      setIsSubmitting(true);
      
      let result: Task;
      if (taskId) {
        result = await updateTask(taskId, {
          name: taskName.trim()
        });
      } else {
        result = await createTask({
          name: taskName.trim()
        });
      }

      setTaskName('');
      reset();
      
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err) {
      // Error is handled by the hook and passed through onError
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    reset();
    setTaskName('');
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <Block>
      <BlockTitle color="primary">{taskId ? "Edit Task" : "New Task"}</BlockTitle>
      {loading && <div className="text-center"><Preloader /></div>}
      <List strong dividers>
        <ListInput 
          outline 
          type="text" 
          value={taskName} 
          placeholder="Enter task name" 
          onChange={(e: any) => setTaskName(e.target.value)} 
          readonly={isSubmitting}
        />
        <div className="display-flex justify-content-space-between padding-horizontal">
          <ListButton onClick={handleCancel} className={isSubmitting ? 'disabled' : ''}>CANCEL</ListButton>
          <ListButton color="primary" onClick={handleSubmit} className={(isSubmitting || !taskName.trim()) ? 'disabled' : ''}>
            {isSubmitting ? (
              <><Preloader size={16} /> {taskId ? "UPDATING..." : "CREATING..."}</>
            ) : (
              taskId ? "UPDATE" : "CREATE"
            )}
          </ListButton>
        </div>
      </List>
    </Block>
  );
}
