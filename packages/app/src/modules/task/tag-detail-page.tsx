import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { HvHash, HvMoreVertical, HvEdit, HvTrash2 } from "@/modules/icons";
import { Navbar } from "../navigation/navbar";
import { Modal, Page } from "../navigation";
import { EmptyState } from "../components/empty-state";
import TaskListItem from "./task-list-item";
import { useAllTasks } from "./use-all-tasks";
import { useLanguageContext } from "../i18n/LanguageContext";
import { useTags } from "./use-tags";
import { Menu } from "@base-ui/react/menu";
import type { Task } from "@/domain/task";

export default function TagDetailPage() {
  const { tagName } = useParams<{ tagName: string }>();
  const navigate = useNavigate();
  const { t } = useLanguageContext();
  const allTasksQuery = useAllTasks();
  const { renameTag, deleteTag } = useTags();

  const decodedTag = tagName ? decodeURIComponent(tagName) : "";

  const [modalMode, setModalMode] = useState<null | "rename" | "delete">(null);
  const [newTagName, setNewTagName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const openRename = () => {
    setNewTagName(decodedTag);
    setModalMode("rename");
  };

  const openDelete = () => setModalMode("delete");

  const closeModal = () => {
    setModalMode(null);
    setNewTagName("");
    setIsSubmitting(false);
  };

  const handleRename = async () => {
    if (!newTagName.trim() || newTagName === decodedTag) return;
    setIsSubmitting(true);
    try {
      await renameTag(decodedTag, newTagName.trim());
      navigate(`/tags/${encodeURIComponent(newTagName.trim())}`, {
        replace: true,
      });
      closeModal();
    } catch (err) {
      console.error("Rename failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      await deleteTag(decodedTag);
      navigate(-1);
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const moreMenu = (
    <Menu.Root>
      <Menu.Trigger
        className="w-9 h-9 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
        aria-label={t("more_options")}
      >
        <HvMoreVertical size={20} />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className="z-[9999]">
          <Menu.Popup className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 min-w-[160px]">
            <Menu.Item
              onClick={openRename}
              className="px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-3 cursor-pointer"
            >
              <HvEdit size={16} />
              {t("rename_tag")}
            </Menu.Item>
            <Menu.Item
              onClick={openDelete}
              className="px-4 py-3 text-left text-sm text-[var(--hvsna-danger-color)] hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-3 cursor-pointer"
            >
              <HvTrash2 size={16} />
              {t("delete_tag")}
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );

  return (
    <Page navbar={<Navbar title={`#${decodedTag}`} rightAction={moreMenu} />}>
      {allTasksQuery.isPending && (
        <div className="flex justify-center items-center h-32 text-gray-500 text-sm">
          {t("loading") || "Loading..."}
        </div>
      )}

      {!allTasksQuery.isPending &&
        tasks.length === 0 &&
        completedTasks.length === 0 && (
          <EmptyState
            icon={<HvHash className="w-full h-full" />}
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
            <TaskListItem key={task.id} task={task} />
          ))}
        </div>
      )}

      {completedTasks.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-4 py-3">
            {t("completed") || "Completed"}
          </h3>
          {completedTasks.map((task) => (
            <TaskListItem key={task.id} task={task} />
          ))}
        </div>
      )}

      <Modal
        isOpen={modalMode === "rename"}
        onClose={closeModal}
        title={t("rename_tag")}
      >
        <div className="p-4 space-y-4">
          <input
            type="text"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            placeholder={t("new_tag_name")}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleRename()}
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={closeModal}
              className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              {t("cancel")}
            </button>
            <button
              onClick={handleRename}
              disabled={isSubmitting || !newTagName.trim()}
              className="px-4 py-2 text-sm text-white bg-[var(--hvsna-primary-color)] hover:bg-[var(--hvsna-primary-color-hover)] rounded-md transition-colors disabled:opacity-50"
            >
              {t("submit")}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={modalMode === "delete"}
        onClose={closeModal}
        title={t("delete_tag")}
      >
        <div className="p-4 space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t("tag_delete_confirm", { name: decodedTag })}
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={closeModal}
              className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              {t("cancel")}
            </button>
            <button
              onClick={handleDelete}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50"
            >
              {t("delete")}
            </button>
          </div>
        </div>
      </Modal>
    </Page>
  );
}
