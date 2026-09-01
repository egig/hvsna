import React, { useState, useMemo, useEffect } from "react";
import { useTags, normalizeTag } from "../../modules/task/use-tags";
import { TagPill, useTagColor } from "../../modules/task/tag-pill";
import { HvCheck, HvSearch } from "../../modules/icons";
import { Modal, ModalNavbar } from "../../modules/navigation";
import { NavActionButton } from "../../modules/components/nav-action-button";

interface TagPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTags: string[];
  onConfirm: (tags: string[]) => void;
}

function TagPickerModal({
  isOpen,
  onClose,
  selectedTags,
  onConfirm,
}: TagPickerModalProps) {
  const { tagNames, loading } = useTags();
  const tagColor = useTagColor();
  const [search, setSearch] = useState("");
  const [pendingTags, setPendingTags] = useState<string[]>(selectedTags);

  useEffect(() => {
    if (isOpen) setPendingTags(selectedTags);
  }, [isOpen]);

  const normalizedSearch = normalizeTag(search);

  const allItems = useMemo(() => {
    const items = new Set([...tagNames, ...pendingTags]);
    return Array.from(items).sort();
  }, [tagNames, pendingTags]);

  const filtered = useMemo(() => {
    if (!normalizedSearch) return allItems;
    return allItems.filter((tag) => tag.includes(normalizedSearch));
  }, [allItems, normalizedSearch]);

  const showCreate = Boolean(
    normalizedSearch && !allItems.includes(normalizedSearch)
  );

  const handleCancel = () => {
    setSearch("");
    onClose();
  };

  const handleConfirm = () => {
    onConfirm(pendingTags);
    setSearch("");
    onClose();
  };

  const handleToggleTag = (tag: string) => {
    setPendingTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleCreate = () => {
    if (normalizedSearch) {
      if (!pendingTags.includes(normalizedSearch)) {
        setPendingTags((prev) => [...prev, normalizedSearch]);
      }
      setSearch("");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleCancel} noPadding>
      <div className="flex flex-col h-full">
        <ModalNavbar
          title="Tags"
          onModalClose={handleCancel}
          rightAction={
            <NavActionButton variant="primary" onClick={handleConfirm}>
              <HvCheck />
            </NavActionButton>
          }
        />

        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          <div className="relative">
            <HvSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search or create tag..."
              className="w-full pl-9 pr-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[var(--hvsna-primary-color)] focus:border-[var(--hvsna-primary-color)]"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && showCreate) {
                  e.preventDefault();
                  handleCreate();
                } else if (e.key === "Enter" && filtered.length > 0) {
                  e.preventDefault();
                  handleToggleTag(filtered[0]);
                }
              }}
            />
          </div>
        </div>

        <ul className="overflow-y-auto h-72">
          {loading && (
            <li className="p-4 text-sm text-gray-500 dark:text-gray-400 text-center">
              Loading tags...
            </li>
          )}

          {!loading && filtered.length === 0 && !showCreate && (
            <li className="p-4 text-sm text-gray-500 dark:text-gray-400 text-center">
              {search.trim()
                ? "No matching tags"
                : "Type to search or create a tag"}
            </li>
          )}

          {showCreate && (
            <li>
              <button
                type="button"
                onClick={handleCreate}
                className="w-full text-left px-4 py-3 text-sm text-[var(--hvsna-primary-color)] transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700"
              >
                <span className="mr-1 font-medium">+</span> Create tag &ldquo;
                {normalizedSearch}&rdquo;
              </button>
            </li>
          )}

          {filtered.map((tag) => {
            const isSelected = pendingTags.includes(tag);
            return (
              <li key={tag}>
                <button
                  type="button"
                  onClick={() => handleToggleTag(tag)}
                  className={`w-full text-left px-4 py-3 text-sm transition-colors flex items-center justify-between ${
                    isSelected
                      ? "font-semibold text-[var(--hvsna-primary-color)] bg-[var(--hvsna-primary-color)]/5"
                      : "text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: tagColor(tag) }}
                    />
                    {tag}
                  </span>
                  {isSelected && (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="shrink-0 text-[var(--hvsna-primary-color)]"
                    >
                      <path
                        d="M13 4L6 11L3 8"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </Modal>
  );
}

export function TagInput({
  selectedTags,
  onTagsChange,
  disabled = false,
  placeholder = "Add tags...",
}: TagInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const tagColor = useTagColor();

  const handleConfirm = (tags: string[]) => {
    onTagsChange(tags);
  };

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(true)}
        className="flex flex-wrap gap-1.5 px-4 py-2 bg-white dark:bg-gray-800 min-h-[42px] w-full text-left items-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {selectedTags.length === 0 ? (
          <span className="text-sm text-gray-400">{placeholder}</span>
        ) : (
          selectedTags.map((tag) => (
            <TagPill
              key={tag}
              name={tag}
              color={tagColor(tag)}
              onRemove={() =>
                onTagsChange(selectedTags.filter((t) => t !== tag))
              }
            />
          ))
        )}
      </button>

      <TagPickerModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        selectedTags={selectedTags}
        onConfirm={handleConfirm}
      />
    </>
  );
}

interface TagInputProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
}
