import { useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import { HvArrowLeft, HvTag } from "@/modules/icons";
import { Navbar } from "../navigation/navbar";
import { Button, Page } from "../navigation";
import { EmptyState } from "../components/empty-state";
import TaskListItem from "./task-list-item";
import { useAllTasks } from "./use-all-tasks";
import { useTaskContext } from "./task-context";
import { useLanguageContext } from "../i18n/LanguageContext";
import type { Task } from "./types";

export default function TagDetailPage() {
  const { tagName } = useParams<{ tagName: string }>();
  const navigate = useNavigate();
  const { t } = useLanguageContext();
  const { openEditTaskForm } = useTaskContext();
  const allTasksQuery = useAllTasks();

  const decodedTag = tagName ? decodeURIComponent(tagName) : "";

  const tasks = useMemo<Task[]>(() => {
    if (!allTasksQuery.data || !decodedTag) return [];
    return allTasksQuery.data.filter(
      (task) => task.tags?.includes(decodedTag) && task.status !== 1
    );
  }, [allTasksQuery.data, decodedTag]);

  const completedTasks = useMemo<Task[]>(() => {
    if (!allTasksQuery.data || !decodedTag) return [];
    return allTasksQuery.data.filter(
      (task) => task.tags?.includes(decodedTag) && task.status === 1
    );
  }, [allTasksQuery.data, decodedTag]);

  const handleEditTask = (task: Task) => {
    openEditTaskForm(task.id as string);
  };

  return (
    <Page
      navbar={
        <Navbar
          title={`#${decodedTag}`}
          leftAction={
            <Button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <HvArrowLeft size={20} />
            </Button>
          }
        />
      }
    >
      {allTasksQuery.isPending && (
        <div className="flex justify-center items-center h-32 text-gray-500 text-sm">
          {t("loading") || "Loading..."}
        </div>
      )}

      {!allTasksQuery.isPending &&
        tasks.length === 0 &&
        completedTasks.length === 0 && (
          <EmptyState
            icon={<HvTag className="w-full h-full" />}
            title={t("no_tasks_in_tag") || `No tasks tagged #${decodedTag}`}
            description={
              t("add_tags_to_tasks") ||
              "Add this tag to tasks to see them here."
            }
          />
        )}

      {tasks.length > 0 && (
        <div>
          {tasks.map((task) => (
            <TaskListItem
              key={task.id}
              task={task}
              onEdit={handleEditTask}
              showDateTime
            />
          ))}
        </div>
      )}

      {completedTasks.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-4 py-3">
            {t("completed") || "Completed"}
          </h3>
          {completedTasks.map((task) => (
            <TaskListItem
              key={task.id}
              task={task}
              onEdit={handleEditTask}
              showDateTime
            />
          ))}
        </div>
      )}
    </Page>
  );
}
