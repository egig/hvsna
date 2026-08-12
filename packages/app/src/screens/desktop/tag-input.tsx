import { useState, useMemo } from "react";
import { Popover, PopoverDisclosure, usePopoverStore } from "@ariakit/react";
import { useTags, normalizeTag } from "@/modules/task/use-tags";
import { HvCheck, HvSearch, HvX } from "@/modules/icons";

interface TagInputDesktopProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function TagInputDesktop({
  selectedTags,
  onTagsChange,
  disabled = false,
  placeholder = "Add tags...",
}: TagInputDesktopProps) {
  const popover = usePopoverStore({ placement: "bottom-start" });
  const isOpen = popover.useState("open");

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
    normalizedSearch && !allItems.includes(normalizedSearch)
  );

  const handleToggleTag = (tag: string) => {
    onTagsChange(
      selectedTags.includes(tag)
        ? selectedTags.filter((t) => t !== tag)
        : [...selectedTags, tag]
    );
  };

  const handleCreate = () => {
    if (!normalizedSearch) return;
    if (!selectedTags.includes(normalizedSearch)) {
      onTagsChange([...selectedTags, normalizedSearch]);
    }
    setSearch("");
  };

  const handleRemoveTag = (e: React.MouseEvent, tag: string) => {
    e.stopPropagation();
    onTagsChange(selectedTags.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (showCreate) {
        handleCreate();
      } else if (filtered.length > 0) {
        handleToggleTag(filtered[0]);
      }
    } else if (e.key === "Escape") {
      popover.hide();
    }
  };

  const triggerButton = (
    <button
      type="button"
      disabled={disabled}
      className={`h-[38px] min-w-[120px] px-3 flex items-center gap-1.5 text-sm transition-colors border-gray-300 dark:border-gray-600 flex-wrap ${
        disabled
          ? "opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-600"
          : "bg-white dark:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 cursor-pointer"
      }`}
    >
      {selectedTags.length === 0 ? (
        <span className="text-gray-400 dark:text-gray-500 text-sm">
          {placeholder}
        </span>
      ) : (
        <>
          {selectedTags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-xs"
            >
              {tag}
              <span
                role="button"
                tabIndex={-1}
                aria-label={`Remove ${tag}`}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer rounded-sm"
                onClick={(e) => handleRemoveTag(e, tag)}
              >
                <HvX size={8} />
              </span>
            </span>
          ))}
          {selectedTags.length > 2 && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              +{selectedTags.length - 2}
            </span>
          )}
        </>
      )}
    </button>
  );

  const popoverBase =
    "bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700";

  return (
    <>
      <PopoverDisclosure store={popover} render={triggerButton} />

      <Popover
        store={popover}
        portal
        gutter={8}
        className={`z-[10001] w-[260px] ${popoverBase}`}
        unmountOnHide
      >
        {/* Search */}
        <div className="p-2 border-b border-gray-100 dark:border-gray-700">
          <div className="relative">
            <HvSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search or create..."
              autoFocus
              className="w-full pl-8 pr-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[var(--hvsna-primary-color)] focus:border-[var(--hvsna-primary-color)]"
            />
          </div>
        </div>

        {/* Tag list */}
        <ul className="overflow-y-auto max-h-56 py-1">
          {loading && (
            <li className="px-3 py-2 text-xs text-gray-400 dark:text-gray-500 text-center">
              Loading...
            </li>
          )}

          {!loading && filtered.length === 0 && !showCreate && (
            <li className="px-3 py-2 text-xs text-gray-400 dark:text-gray-500 text-center">
              {search.trim() ? "No matching tags" : "No tags yet"}
            </li>
          )}

          {showCreate && (
            <li>
              <button
                type="button"
                onClick={handleCreate}
                className="w-full text-left px-3 py-2 text-sm text-[var(--hvsna-primary-color)] hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
              >
                <span className="font-semibold text-base leading-none">+</span>
                <span>
                  Create &ldquo;
                  <span className="font-medium">{normalizedSearch}</span>
                  &rdquo;
                </span>
              </button>
            </li>
          )}

          {filtered.map((tag) => {
            const isSelected = selectedTags.includes(tag);
            return (
              <li key={tag}>
                <button
                  type="button"
                  onClick={() => handleToggleTag(tag)}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors flex items-center justify-between gap-2 ${
                    isSelected
                      ? "text-[var(--hvsna-primary-color)] bg-[var(--hvsna-primary-color)]/5 font-medium"
                      : "text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  <span className="truncate">{tag}</span>
                  {isSelected && (
                    <HvCheck className="w-3.5 h-3.5 shrink-0 text-[var(--hvsna-primary-color)]" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        {/* Selected count footer */}
        {selectedTags.length > 0 && (
          <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100 dark:border-gray-700">
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {selectedTags.length} selected
            </span>
            <button
              type="button"
              onClick={() => onTagsChange([])}
              className="text-xs text-[var(--hvsna-danger-color)] hover:text-[var(--hvsna-danger-color-hover)] transition-colors"
            >
              Clear all
            </button>
          </div>
        )}
      </Popover>
    </>
  );
}
