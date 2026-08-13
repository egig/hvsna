import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { HvHash, HvMoreVertical, HvEdit, HvTrash2, HvCheck, HvPlus } from "@/modules/icons";
import { Navbar } from "../navigation/navbar";
import { Modal, Page } from "../navigation";
import { EmptyState } from "../components/empty-state";
import TaskListItem from "./task-list-item";
import { useAllTasks } from "./use-all-tasks";
import { useLanguageContext } from "../i18n/LanguageContext";
import { useTags } from "./use-tags";
import { Menu } from "@base-ui/react/menu";
import type { Task } from "@/domain/task";
import { TAG_COLOR_PALETTE, DEFAULT_TAG_COLOR } from "@/domain/tag";

export default function TagDetailPage() {
  const { tagName } = useParams<{ tagName: string }>();
  const navigate = useNavigate();
  const { t } = useLanguageContext();
  const allTasksQuery = useAllTasks();
  const { tags, renameTag, setTagColor, deleteTag } = useTags();

  const decodedTag = tagName ? decodeURIComponent(tagName) : "";
  const tagColor = tags.find((t) => t.name === decodedTag)?.color ?? DEFAULT_TAG_COLOR;

  const [modalMode, setModalMode] = useState<null | "edit" | "delete">(null);
  const [newTagName, setNewTagName] = useState("");
  const [editColor, setEditColor] = useState(DEFAULT_TAG_COLOR);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isCustomColor = !(TAG_COLOR_PALETTE as readonly string[]).includes(editColor);

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

  const openEdit = () => {
    setNewTagName(decodedTag);
    setEditColor(tagColor);
    setModalMode("edit");
  };

  const openDelete = () => setModalMode("delete");

  const closeModal = () => {
    setModalMode(null);
    setNewTagName("");
    setIsSubmitting(false);
  };

  const canSaveEdit =
    newTagName.trim().length > 0 &&
    (newTagName.trim() !== decodedTag || editColor !== tagColor);

  const handleSaveEdit = async () => {
    const trimmedName = newTagName.trim();
    if (!canSaveEdit) return;
    setIsSubmitting(true);
    try {
      if (editColor !== tagColor) {
        await setTagColor(decodedTag, editColor);
      }
      if (trimmedName !== decodedTag) {
        await renameTag(decodedTag, trimmedName);
        navigate(`/tags/${encodeURIComponent(trimmedName)}`, {
          replace: true,
        });
      }
      closeModal();
    } catch (err) {
      console.error("Edit tag failed:", err);
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
              onClick={openEdit}
              className="px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-3 cursor-pointer"
            >
              <HvEdit size={16} />
              {t("edit_tag")}
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

  const navTitle = (
    <span className="flex items-center gap-2">
      <span
        className="w-2.5 h-2.5 rounded-full shrink-0"
        style={{ backgroundColor: tagColor }}
        aria-hidden
      />
      {`#${decodedTag}`}
    </span>
  );

  return (
    <Page navbar={<Navbar title={navTitle} rightAction={moreMenu} />}>
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
        isOpen={modalMode === "edit"}
        onClose={closeModal}
        title={t("edit_tag")}
      >
        <div className="p-4 space-y-4">
          <input
            type="text"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            placeholder={t("new_tag_name")}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleSaveEdit()}
          />

          <div>
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              {t("tag_color")}
            </div>
            <div className="grid grid-cols-5 gap-3">
              {TAG_COLOR_PALETTE.map((color) => (
                <button
                  key={color}
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setEditColor(color)}
                  aria-label={color}
                  className="w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-50"
                  style={{ backgroundColor: color }}
                >
                  {!isCustomColor && color === editColor && (
                    <HvCheck size={16} className="text-white" />
                  )}
                </button>
              ))}
              <label
                className="relative w-10 h-10 rounded-full flex items-center justify-center cursor-pointer overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-600"
                style={isCustomColor ? { backgroundColor: editColor, borderStyle: "solid", borderColor: editColor } : undefined}
                aria-label={t("custom_color")}
              >
                {isCustomColor ? (
                  <HvCheck size={16} className="text-white" />
                ) : (
                  <HvPlus size={16} className="text-gray-400 dark:text-gray-500" />
                )}
                <input
                  type="color"
                  value={editColor}
                  disabled={isSubmitting}
                  onChange={(e) => setEditColor(e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={closeModal}
              className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              {t("cancel")}
            </button>
            <button
              onClick={handleSaveEdit}
              disabled={isSubmitting || !canSaveEdit}
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
