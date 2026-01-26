import { useEffect, useRef, useState } from "react";
import { Icon, List, ListItem, Navbar, NavTitle, Page, Preloader, Block, Button, Sheet, NavRight, Link, ListButton, ListInput, f7 } from "framework7-react";
import { useTasks } from "../hooks/useTasks";
import { CheckCircleIcon, CircleIcon, Trash2Icon, EditIcon, PlusIcon, Plus } from "lucide-react";
import type { Task, TaskStatus } from "~/lib/types/task";
import TaskForm from "../components/task-form";

export default function Tasks() {
  const { tasks, loading, loadingMore, error, hasMore, deleteTask, refreshTasks, loadMoreTasks, createTask, updateTask } = useTasks();
  const allowInfinite = useRef(true);
  const [sheetOpened, setSheetOpened] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskName, setTaskName] = useState('');
  const [scheduledAt, setScheduledAt] = useState<string>('');

  const resetForm = () => {
    setTaskName('');
    setScheduledAt('');
    setEditingTask(null);
  };

  const openAddPopup = () => {
    // Reset form first, then open sheet
    setEditingTask(null);
    setTaskName('');
    setScheduledAt('');
    // Use setTimeout to ensure state is set before opening sheet
    setTimeout(() => setSheetOpened(true), 0);
  };

  const openEditPopup = (task: Task) => {
    setEditingTask(task);
    setTaskName(task.name);
    setScheduledAt(task.scheduledAt || '');
    setSheetOpened(true);
  };

  const closePopup = () => {
    setSheetOpened(false);
  };

  // Reset form when sheet is closed
  useEffect(() => {
    if (!sheetOpened) {
      resetForm();
    }
  }, [sheetOpened]);

  const handleSubmit = async () => {
    if (!taskName.trim()) return;

    try {
      if (editingTask) {
        await updateTask(editingTask.id, {
          name: taskName.trim(),
          scheduledAt: scheduledAt || undefined
        });
      } else {
        await createTask({
          name: taskName.trim(),
          scheduledAt: scheduledAt || undefined
        });
      }
      // Close sheet after successful operation
      setSheetOpened(false);
    } catch (err) {
      console.error('Failed to save task:', err);
      f7.dialog.alert('Failed to save task. Please try again.');
    }
  };

  const handleDeleteTask = async (task: Task) => {
    f7.dialog.confirm(
      `Are you sure you want to delete "${task.name}"?`,
      'Delete Task',
      async () => {
        try {
          await deleteTask(task.id);
        } catch (err) {
          console.error('Failed to delete task:', err);
          f7.dialog.alert('Failed to delete task. Please try again.');
        }
      }
    );
  };

  const handleStatusChange = async (task: Task, newStatus: TaskStatus) => {
    try {
      await updateTask(task.id, { status: newStatus });
    } catch (err) {
      console.error('Failed to update task status:', err);
      f7.dialog.alert('Failed to update task status. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatScheduledDate = (dateString?: string) => {
    if (!dateString) return 'No date set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon size={24} className="text-green-500" />;
      case 'in_progress':
        return <CircleIcon size={24} className="text-blue-500" />;
      default:
        return <CircleIcon size={24} className="text-gray-400" />;
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'in_progress':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const handleInfiniteScroll = () => {
    if (!allowInfinite.current) return;
    
    // Don't load more if already loading or no more data
    if (loadingMore || !hasMore) {
      allowInfinite.current = false;
      return;
    }
    
    allowInfinite.current = false;
    loadMoreTasks().finally(() => {
      allowInfinite.current = true;
    });
  };

  return (
    <Page 
      infinite 
      infiniteDistance={50} 
      infinitePreloader={loadingMore && hasMore}
      onInfinite={handleInfiniteScroll}
    >
      <Navbar>
        <NavTitle>Tasks</NavTitle>
        <NavRight>
          <Link onClick={openAddPopup}>
          <Plus />
          </Link>
        </NavRight>
      </Navbar>
      
      {loading && (
        <Block className="text-center">
          <Preloader />
          <div>Loading tasks...</div>
        </Block>
      )}

      {error && (
        <Block className="text-center">
          <div style={{ color: 'red' }}>Error: {error}</div>
          <Button fill onClick={refreshTasks}>
            <Icon ios="f7:arrow_clockwise" md="material:refresh" />
            Retry
          </Button>
        </Block>
      )}

      {!loading && !error && tasks.length === 0 &&
        <Block className="text-center">
          <Icon ios="f7:checkmark_square" md="material:check_box" size="48" />
          <p>No tasks yet</p>
          <p>Create your first task to get started!</p>
          <Button fill onClick={openAddPopup}>
            <PlusIcon size={16} />
            Create Task
          </Button>
        </Block>
      }

      {!loading && !error && tasks.length > 0 &&
        <List mediaList>
          {tasks.map((task) => (
            <ListItem
              key={task.id}
              title={task.name}
                    subtitle={`Scheduled: ${formatScheduledDate(task.scheduledAt)}`}
                    swipeout
                  >
                    <div slot="root-end" className="swipeout-actions-right">
                      <a 
                        href="#" 
                        className="swipeout-delete"
                        onClick={() => handleDeleteTask(task)}
                      >
                        Delete
                      </a>
                    </div>
                    <div slot="media" onClick={() => handleStatusChange(task, 
                      task.status === 'pending' ? 'in_progress' : 
                      task.status === 'in_progress' ? 'completed' : 'pending'
                    )}>
                      {getStatusIcon(task.status)}
                    </div>
                    <div slot="after">
                      <span className={getStatusColor(task.status)}>
                        {task.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div slot="root" onClick={() => openEditPopup(task)} style={{ cursor: 'pointer' }}>
                    </div>
                  </ListItem>
                ))}
              </List>
      }
              {!hasMore && tasks.length > 0 && (
                <Block className="text-center">
                  <p>No more tasks to load</p>
                </Block>
              )}


      <Sheet 
        opened={sheetOpened} 
        onSheetClose={closePopup}
        backdrop
        swipeToClose
        closeOnEscape
      >
        <div className="sheet-modal-swipe-step">
          <div className="sheet-modal-swipe-handler" />
        </div>
        
        <TaskForm
          editingTask={editingTask}
          taskName={taskName}
          onTaskNameChange={setTaskName}
          onSubmit={handleSubmit}
        />
      </Sheet>
    </Page>
  );
}
