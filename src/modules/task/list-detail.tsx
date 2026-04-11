import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { HvList, HvEdit2, HvTrash2, HvMoreVertical } from "@/modules/icons";
import { Menu } from "@base-ui/react/menu";
import { Navbar } from "../navigation/navbar";
import { Page } from "../navigation";
import { useLists } from "./use-lists";
import { useListTasks } from "./use-list-tasks";
import { useLanguageContext } from "../i18n/LanguageContext";
import { useListContext } from "./list-context";
import { DeleteListModal } from "./delete-list-modal";
import type { List, Task } from "./types";
import TaskListItem from "./task-list-item";
import { useTaskContext } from "./task-context";
import { useScreenSize } from "../system";

export default function ListDetail() {
  const { t } = useLanguageContext();
  const { listId } = useParams<{ listId: string }>();
  const navigate = useNavigate();
  const { openEditTaskForm } = useTaskContext();
  const { openListForm } = useListContext();
  const { isDesktop } = useScreenSize();

  const {
    lists,
    loading: listsLoading,
    error: listsError,
    getList,
    deleteList,
    updating: isUpdatingList,
  } = useLists();

  const {
    tasks,
    loading: tasksLoading,
    error: tasksError,
    refreshTasks,
  } = useListTasks({ listId: listId || "", enabled: !!listId });

  const [currentList, setCurrentList] = useState<List | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleEditList = () => {
    if (currentList) {
      openListForm(currentList.id);
    }
  };

  const handleDeleteList = () => {
    if (!currentList) {
      return;
    }

    setShowDeleteModal(true);
  };

  const confirmDeleteList = async (deleteTasks: boolean) => {
    if (!currentList) {
      return;
    }

    const success = await deleteList(currentList.id!, deleteTasks);
    if (success) {
      setShowDeleteModal(false);
      navigate("/browse");
    }
  };

  // Load list details
  useEffect(() => {
    if (listId) {
      getList(listId).then(setCurrentList);
    }
  }, [listId, getList]);

  // Reload list when update completes
  useEffect(() => {
    if (!isUpdatingList && listId && currentList) {
      // Reload the list after an update operation completes
      getList(listId).then(setCurrentList);
    }
  }, [isUpdatingList, listId, currentList, getList, lists]);

  if (listsLoading) {
    return (
      <Page navbar={<Navbar title={t("loading") || "Loading..."} />}>
        <div className="flex justify-center items-center h-32">
          <div className="text-gray-500">{t("loading") || "Loading..."}</div>
        </div>
      </Page>
    );
  }

  if (listsError) {
    return (
      <Page navbar={<Navbar title={t("error") || "Error"} />}>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded m-4">
          {listsError}
        </div>
      </Page>
    );
  }

  if (!currentList) {
    return (
      <Page navbar={<Navbar title={t("list_not_found") || "List Not Found"} />}>
        <div className="text-center py-12">
          <HvList size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t("list_not_found") || "List Not Found"}
          </h3>
          <p className="text-gray-500 mb-4">
            {t("list_not_found_description") ||
              "The list you're looking for doesn't exist or has been deleted."}
          </p>
        </div>
      </Page>
    );
  }

  return (
    <Page
      navbar={
        <Navbar
          title={currentList.name}
          rightAction={
            !isDesktop && (
              <Menu.Root>
                <Menu.Trigger
                  className="w-10 h-10 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full flex items-center justify-center transition-colors"
                  aria-label="More options"
                >
                  <HvMoreVertical size={20} />
                </Menu.Trigger>

                <Menu.Portal>
                  <Menu.Positioner className="z-[9999]">
                    <Menu.Popup className="z-[9999] bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 pointer-events-auto">
                      <Menu.Item
                        onClick={handleEditList}
                        className="px-4 py-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-3 cursor-pointer pointer-events-auto"
                      >
                        <HvEdit2 size={18} />
                        {t("edit_list")}
                      </Menu.Item>
                      <Menu.Item
                        onClick={handleDeleteList}
                        className="px-4 py-3 text-left hover:text-[var(--hvsna-danger-color-hover)] text-[var(--hvsna-danger-color)] hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-3 cursor-pointer pointer-events-auto"
                      >
                        <HvTrash2 size={18} />
                        {t("delete_list")}
                      </Menu.Item>
                    </Menu.Popup>
                  </Menu.Positioner>
                </Menu.Portal>
              </Menu.Root>
            )
          }
        />
      }
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
          <HvList size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t("no_tasks_in_list") || "No Tasks in List"}
          </h3>
          <p className="text-gray-500 mb-4">
            {t("no_tasks_in_list_description") ||
              "There are no tasks in this list yet. Create your first task to get started."}
          </p>
        </div>
      )}

      {tasks.length > 0 && (
        <div className="tasks-scroll-container">
          {tasks.map((task: Task) => (
            <TaskListItem
              key={task.id}
              task={task}
              onEdit={() => openEditTaskForm(task.id as string)}
              showDateTime={true}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteListModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDeleteList}
        listName={currentList?.name || ""}
        tasks={tasks}
      />
    </Page>
  );
}
