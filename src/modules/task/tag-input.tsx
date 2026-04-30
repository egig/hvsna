import React, { useState, useMemo } from "react";
import { useTags, normalizeTag } from "./use-tags";
import { HvSearch, HvX } from "../icons";
import { Modal } from "../navigation";

interface TagInputProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

interface TagPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  onCreateTag: (tag: string) => void;
}

function TagPickerModal({
  isOpen,
  onClose,
  selectedTags,
  onToggleTag,
  onCreateTag,
}: TagPickerModalProps) {
  const { tagNames, loading } = useTags();
  const [search, setSearch] = useState("");

  const normalizedSearch = normalizeTag(search);

  const allItems = useMemo(() => {
    const items = new Set([...tagNames, ...selectedTags]);
    return Array.from(items).sort();
  }, [tagNames, selectedTags]);

  const filtered = useMemo(() => {
    if (!normalizedSearch) return allItems;
    return allItems.filter((tag) => tag.includes(normalizedSearch));
  }, [allItems, normalizedSearch]);

  const showCreate = Boolean(
    normalizedSearch &&
      !allItems.includes(normalizedSearch) &&
      !selectedTags.includes(normalizedSearch)
  );

  const handleClose = () => {
    setSearch("");
    onClose();
  };

  const handleCreate = () => {
    if (normalizedSearch) {
      onCreateTag(normalizedSearch);
      setSearch("");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Tags" noPadding>
      <div className="flex flex-col h-full">
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
                  onToggleTag(filtered[0]);
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
              {search.trim() ? "No matching tags" : "Type to search or create a tag"}
            </li>
          )}

          {showCreate && (
            <li>
              <button
                type="button"
                onClick={handleCreate}
                className="w-full text-left px-4 py-3 text-sm text-[var(--hvsna-primary-color)] transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700"
              >
                <span className="mr-1 font-medium">+</span> Create tag &ldquo;{normalizedSearch}&rdquo;
              </button>
            </li>
          )}

          {filtered.map((tag) => {
            const isSelected = selectedTags.includes(tag);
            return (
              <li key={tag}>
                <button
                  type="button"
                  onClick={() => onToggleTag(tag)}
                  className={`w-full text-left px-4 py-3 text-sm transition-colors flex items-center justify-between ${
                    isSelected
                      ? "font-semibold text-[var(--hvsna-primary-color)] bg-[var(--hvsna-primary-color)]/5"
                      : "text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  <span>{tag}</span>
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

  const handleToggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter((t) => t !== tag));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  const handleCreateTag = (tag: string) => {
    const normalized = normalizeTag(tag);
    if (normalized && !selectedTags.includes(normalized)) {
      onTagsChange([...selectedTags, normalized]);
    }
  };

  const handleRemoveTag = (e: React.MouseEvent, tag: string) => {
    e.stopPropagation();
    onTagsChange(selectedTags.filter((t) => t !== tag));
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
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm"
            >
              {tag}
              <span
                role="button"
                tabIndex={0}
                aria-label={`Remove ${tag}`}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer p-0.5 rounded-sm hover:bg-gray-200 dark:hover:bg-gray-600"
                onClick={(e) => handleRemoveTag(e, tag)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.stopPropagation();
                    onTagsChange(selectedTags.filter((t) => t !== tag));
                  }
                }}
              >
                <HvX size={10} />
              </span>
            </span>
          ))
        )}
      </button>

      <TagPickerModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        selectedTags={selectedTags}
        onToggleTag={handleToggleTag}
        onCreateTag={handleCreateTag}
      />
    </>
  );
}

interface TagListProps {
  tags: string[];
  onTagClick?: (tag: string) => void;
  className?: string;
}

export function TagList({ tags, onTagClick, className = "" }: TagListProps) {
  if (!tags || tags.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {tags.map((tag) => (
        <span
          key={tag}
          onClick={() => onTagClick?.(tag)}
          className={`inline-block px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-xs ${
            onTagClick ? "cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600" : ""
          }`}
        >
          {tag}
        </span>
      ))}
    </div>
  );
}
