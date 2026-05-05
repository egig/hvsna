import { useState } from "react";
import { useNavigate } from "react-router";
import {
  HvArrowLeft,
  HvEdit,
  HvMerge,
  HvTrash2,
  HvTag,
  HvX,
} from "@/modules/icons";
import { Navbar } from "../navigation/navbar";
import { Button, Page } from "../navigation";
import { useLanguageContext } from "../i18n/LanguageContext";
import { useTags, type TagInfo } from "./use-tags";
import { Modal } from "../navigation/modal";

export default function TagManagementPage() {
  const { t } = useLanguageContext();
  const navigate = useNavigate();
  const { tags, loading, error, renameTag, deleteTag, mergeTags } = useTags();

  const [selectedTag, setSelectedTag] = useState<TagInfo | null>(null);
  const [modalMode, setModalMode] = useState<
    null | "rename" | "merge" | "delete"
  >(null);
  const [newTagName, setNewTagName] = useState("");
  const [mergeTarget, setMergeTarget] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openModal = (tag: TagInfo, mode: "rename" | "merge" | "delete") => {
    setSelectedTag(tag);
    setModalMode(mode);
    setNewTagName(tag.name);
    setMergeTarget("");
  };

  const closeModal = () => {
    setSelectedTag(null);
    setModalMode(null);
    setNewTagName("");
    setMergeTarget("");
    setIsSubmitting(false);
  };

  const handleRename = async () => {
    if (!selectedTag || !newTagName.trim() || newTagName === selectedTag.name)
      return;
    setIsSubmitting(true);
    try {
      await renameTag(selectedTag.name, newTagName.trim());
      closeModal();
    } catch (err) {
      console.error("Rename failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMerge = async () => {
    if (!selectedTag || !mergeTarget) return;
    setIsSubmitting(true);
    try {
      await mergeTags(selectedTag.name, mergeTarget);
      closeModal();
    } catch (err) {
      console.error("Merge failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedTag) return;
    setIsSubmitting(true);
    try {
      await deleteTag(selectedTag.name);
      closeModal();
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Page
      navbar={
        <Navbar
          title={t("manage_tags")}
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
      {loading && (
        <div className="flex justify-center items-center h-32">
          <div className="text-gray-500">{t("loading") || "Loading..."}</div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded m-4">
          {error}
        </div>
      )}

      {!loading && tags.length === 0 && (
        <div className="text-center py-12 px-4">
          <HvTag size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t("no_tags_yet")}
          </h3>
          <p className="text-gray-500">{t("create_tags_description")}</p>
        </div>
      )}

      {tags.length > 0 && (
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {tags.map((tag) => (
            <div
              key={tag.name}
              className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <HvTag size={16} className="text-gray-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {tag.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {t("tag_count_tasks", { count: tag.count })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => openModal(tag, "rename")}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
                  aria-label={t("rename_tag")}
                >
                  <HvEdit size={16} />
                </button>
                {tags.length > 1 && (
                  <button
                    onClick={() => openModal(tag, "merge")}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
                    aria-label={t("merge_tags")}
                  >
                    <HvMerge size={16} />
                  </button>
                )}
                <button
                  onClick={() => openModal(tag, "delete")}
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors cursor-pointer"
                  aria-label={t("delete_tag")}
                >
                  <HvTrash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rename Modal */}
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

      {/* Merge Modal */}
      <Modal
        isOpen={modalMode === "merge"}
        onClose={closeModal}
        title={t("merge_tags")}
      >
        <div className="p-4 space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {selectedTag &&
              t("tag_merge_confirm", {
                source: selectedTag.name,
                target: mergeTarget,
              })}
          </p>
          <select
            value={mergeTarget}
            onChange={(e) => setMergeTarget(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
          >
            <option value="" disabled>
              {t("select_tag_to_merge")}
            </option>
            {tags
              .filter((t) => t.name !== selectedTag?.name)
              .map((tag) => (
                <option key={tag.name} value={tag.name}>
                  {tag.name} ({t("tag_count_tasks", { count: tag.count })})
                </option>
              ))}
          </select>
          <div className="flex justify-end gap-2">
            <button
              onClick={closeModal}
              className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              {t("cancel")}
            </button>
            <button
              onClick={handleMerge}
              disabled={isSubmitting || !mergeTarget}
              className="px-4 py-2 text-sm text-white bg-[var(--hvsna-primary-color)] hover:bg-[var(--hvsna-primary-color-hover)] rounded-md transition-colors disabled:opacity-50"
            >
              {t("submit")}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={modalMode === "delete"}
        onClose={closeModal}
        title={t("delete_tag")}
      >
        <div className="p-4 space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {selectedTag && t("tag_delete_confirm", { name: selectedTag.name })}
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
