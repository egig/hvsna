import {
  HvSettings,
  HvHash,
  HvOutlineEllipsisHorizontalCircle,
  HvCheckCircle,
  HvCheckSquare2,
  HvReplayCircle,
  HvEdit,
  HvTrash2,
} from "@/modules/icons";
import { useNavigate } from "react-router";
import { Navbar } from "../navigation/navbar";
import { Button, Link, Modal, Page } from "../navigation";
import { useLanguageContext } from "../i18n/LanguageContext";
import { MenuItem } from "../components/menu-item";
import { useTags, type TagInfo } from "./use-tags";
import { useState } from "react";
import BlockTitle from "../components/block-title";

export default function Browse() {
  const { t } = useLanguageContext();
  const { tags, renameTag, deleteTag } = useTags();

  const [selectedTag, setSelectedTag] = useState<TagInfo | null>(null);
  const [modalMode, setModalMode] = useState<null | "rename" | "delete">(null);
  const [newTagName, setNewTagName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openModal = (tag: TagInfo, mode: "rename" | "delete") => {
    setSelectedTag(tag);
    setModalMode(mode);
    setNewTagName(tag.name);
  };

  const closeModal = () => {
    setSelectedTag(null);
    setModalMode(null);
    setNewTagName("");
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
          title={t("browse")}
          showBackButton={false}
          rightAction={
            <Button to={"/settings"}>
              <HvSettings />
            </Button>
          }
        />
      }
    >
      {/* Navigation Menu Items */}
      <div className="mb-6 space-y-1">
        <MenuItem
          icon={HvReplayCircle}
          title={t("recurring") || "Recurring"}
          to="/recurring"
        />
        <MenuItem
          icon={HvCheckSquare2}
          title={t("completed") || "Completed"}
          to="/completed"
        />
      </div>

      {tags.length > 0 && (
        <>
          <BlockTitle>Tags</BlockTitle>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {tags.map((tag) => (
              <div
                key={tag.name}
                className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <Link
                  to={`/tags/${encodeURIComponent(tag.name)}`}
                  className="flex items-center gap-3 min-w-0 flex-1"
                >
                  <HvHash size={16} className="text-gray-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {tag.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {t("tag_count_tasks", { count: tag.count })}
                    </p>
                  </div>
                </Link>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => openModal(tag, "rename")}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
                    aria-label={t("rename_tag")}
                  >
                    <HvEdit size={16} />
                  </button>
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
        </>
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
