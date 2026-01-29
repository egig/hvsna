import { useState, useEffect } from "react";
import { useTask } from "../hooks/use-task";
import type { Task } from "~/lib/types/task";
import { FormInput } from "./FormInput";
import { Card, CardHeader, CardTitle, CardContent } from "./Card";
import { LoadingSpinner } from "./Loading";
import { Button, Page, Navbar } from "../navigation/components";

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
    <Page>
      <Navbar 
        title={taskId ? "Edit Task" : "New Task"}
        showBackButton={true}
        customBackAction={onCancel}
      />
      
      <div className="
        flex-1
        overflow-y-auto
        scroll-area
        bg-gray-50
        safe-top
        safe-bottom
        safe-x
      ">
        <div className="
          max-w-lg
          mx-auto
          w-full
          py-4
          px-4
        ">
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle size="md" className="text-center">
                {taskId ? "Edit Task" : "New Task"}
              </CardTitle>
            </CardHeader>
            
            <CardContent className="pt-0">
              {loading && (
                <div className="flex justify-center py-12">
                  <LoadingSpinner size="lg" text="Loading task data..." />
                </div>
              )}
              
              <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                <div className="space-y-5">
                  <FormInput
                    label="Task Name"
                    value={taskName}
                    placeholder="Enter task name"
                    disabled={isSubmitting}
                    required={true}
                    onChange={setTaskName}
                    className="text-base"
                  />
                </div>
                
                <div className="
                  flex
                  gap-4
                  mt-8
                  mb-4
                  safe-bottom
                ">
                  <Button
                    type="button"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                    className="
                      flex-1
                      min-h-[44px]
                      text-base
                      font-medium
                      py-3
                      px-4
                      bg-gray-200
                      hover:bg-gray-300
                      text-gray-800
                      rounded-lg
                      transition-colors
                      duration-200
                      active:scale-[0.98]
                      touch-action-manipulation
                    "
                  >
                    Cancel
                  </Button>
                  
                  <Button
                    type="submit"
                    disabled={isSubmitting || !taskName.trim()}
                    className="
                      flex-1
                      min-h-[44px]
                      text-base
                      font-medium
                      py-3
                      px-4
                      bg-blue-500
                      hover:bg-blue-600
                      disabled:bg-gray-300
                      disabled:cursor-not-allowed
                      text-white
                      rounded-lg
                      transition-colors
                      duration-200
                      active:scale-[0.98]
                      touch-action-manipulation
                      shadow-sm
                    "
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center">
                        <LoadingSpinner size="sm" />
                        <span className="ml-2">
                          {taskId ? "UPDATING..." : "CREATING..."}
                        </span>
                      </div>
                    ) : (
                      taskId ? "UPDATE" : "CREATE"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
          
          {/* Mobile-friendly help text */}
          <div className="
            text-center
            text-sm
            text-gray-500
            mb-6
            px-2
          ">
            <p>
              Tasks help you organize and track your daily activities.
            </p>
            <p className="mt-1">
              Create tasks to stay productive and achieve your goals.
            </p>
          </div>
        </div>
      </div>
    </Page>
  );
}
