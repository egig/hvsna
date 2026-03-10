import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Plus, List as ListIcon } from "lucide-react";
import { Navbar } from "../navigation/navbar";
import { Modal } from "../navigation/modal";
import { Button, Page } from "../navigation";
import { useLists } from "./use-lists";
import { useTasks } from "./use-tasks";
import { useLanguageContext } from "../i18n/LanguageContext";
import type { List, Task } from "./types";
import TaskListItem from "./task-list-item";
import { useTaskContext } from "./task-context";

export default function ListDetail() {
  const { t } = useLanguageContext();
  const { listId } = useParams<{ listId: string }>();
  const navigate = useNavigate();
  const { openTaskForm } = useTaskContext();

  const [createTaskModalOpened, setCreateTaskModalOpened] = useState(false);

  const {
    lists,
    loading: listsLoading,
    error: listsError,
    getList,
  } = useLists();

  const {
    tasks,
    loading: tasksLoading,
    error: tasksError,
    openEditPopup,
    handleTaskSuccess,
    handleTaskError,
    handleTaskCancel,
    refreshTasks,
    setListIdFilter,
  } = useTasks();

  const [currentList, setCurrentList] = useState<List | null>(null);

  // Load list details and set filter
  useEffect(() => {
    if (listId) {
      loadListDetails();
      setListIdFilter(listId);
    }

    // Cleanup filter when unmounting
    return () => {
      setListIdFilter(null);
    };
  }, [listId, setListIdFilter]);

  const loadListDetails = async () => {
    if (listId) {
      const list = await getList(listId);
      setCurrentList(list);
    }
  };

  const handleCreateTask = () => {
    // Open task form with pre-filled listId
    openTaskForm(undefined, { listId });
  };

  const goBack = () => {
    navigate("/list");
  };

  if (listsLoading) {
    return (
      <Page
        navbar={
          <Navbar
            title={t("loading") || "Loading..."}
            customBackAction={goBack}
          />
        }
      >
        <div className="flex justify-center items-center h-32">
          <div className="text-gray-500">{t("loading") || "Loading..."}</div>
        </div>
      </Page>
    );
  }

  if (listsError) {
    return (
      <Page
        navbar={
          <Navbar title={t("error") || "Error"} customBackAction={goBack} />
        }
      >
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded m-4">
          {listsError}
        </div>
      </Page>
    );
  }

  if (!currentList) {
    return (
      <Page
        navbar={
          <Navbar
            title={t("list_not_found") || "List Not Found"}
            customBackAction={goBack}
          />
        }
      >
        <div className="text-center py-12">
          <ListIcon size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t("list_not_found") || "List Not Found"}
          </h3>
          <p className="text-gray-500 mb-4">
            {t("list_not_found_description") ||
              "The list you're looking for doesn't exist or has been deleted."}
          </p>
          <Button onClick={goBack}>
            <ArrowLeft size={20} className="mr-2" />
            {t("back_to_lists") || "Back to Lists"}
          </Button>
        </div>
      </Page>
    );
  }

  return (
    <Page
      navbar={<Navbar title={currentList.name} customBackAction={goBack} />}
    >
      {currentList.description && (
        <div className="px-4 py-2 border-b border-gray-200">
          <p className="text-gray-600 text-sm">{currentList.description}</p>
        </div>
      )}

      {tasksLoading && (
        <div className="flex justify-center items-center h-32">
          <div className="text-gray-500">
            {t("loading_tasks") || "Loading tasks..."}
          </div>
        </div>
      )}

      {tasksError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded m-4">
          {tasksError}
        </div>
      )}

      {!tasksLoading && tasks.length === 0 && (
        <div className="text-center py-12">
          <ListIcon size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t("no_tasks_in_list") || "No Tasks in List"}
          </h3>
          <p className="text-gray-500 mb-4">
            {t("no_tasks_in_list_description") ||
              "There are no tasks in this list yet. Create your first task to get started."}
          </p>
          <Button onClick={handleCreateTask}>
            <Plus size={20} className="mr-2" />
            {t("create_first_task") || "Create First Task"}
          </Button>
        </div>
      )}

      {tasks.length > 0 && (
        <div className="tasks-scroll-container">
          {tasks.map((task: Task) => (
            <TaskListItem
              key={task.id}
              task={task}
              onEdit={() => openEditPopup(task)}
              showDateTime={true}
            />
          ))}
        </div>
      )}
    </Page>
  );
}
