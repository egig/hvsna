import React, { useState, useMemo } from "react";
import { useTags, normalizeTag } from "./use-tags";
import { Combobox } from "@base-ui/react/combobox";
import { HvX } from "../icons";

interface TagInputProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function TagInput({
  selectedTags,
  onTagsChange,
  disabled = false,
  placeholder = "Add tag...",
}: TagInputProps) {
  const { tagNames, loading } = useTags();
  const [inputValue, setInputValue] = useState("");

  // Combine existing tags with selected tags to ensure selected tags are always available
  const allItems = useMemo(() => {
    const items = new Set([...tagNames, ...selectedTags]);
    return Array.from(items).sort();
  }, [tagNames, selectedTags]);

  // Filter items based on input value
  const filteredItems = useMemo(() => {
    const normalizedInput = normalizeTag(inputValue);
    if (!normalizedInput) {
      return allItems.filter((tag) => !selectedTags.includes(tag));
    }
    return allItems.filter(
      (tag) =>
        tag.includes(normalizedInput) && !selectedTags.includes(tag)
    );
  }, [allItems, inputValue, selectedTags]);

  // Check if we should show the "Create new" option
  const normalizedInput = inputValue.trim()
    ? normalizeTag(inputValue)
    : "";
  const showCreateNew = Boolean(
    normalizedInput &&
    !allItems.includes(normalizedInput) &&
    !selectedTags.includes(normalizedInput)
  );

  const handleValueChange = (value: string[]) => {
    // Normalize all new tags
    const normalized = value.map((v) => normalizeTag(v)).filter(Boolean);
    // Remove duplicates
    const unique = Array.from(new Set(normalized));
    onTagsChange(unique);
    setInputValue("");
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  // Handle creating a new tag from input
  const handleCreateTag = () => {
    if (normalizedInput && !selectedTags.includes(normalizedInput)) {
      onTagsChange([...selectedTags, normalizedInput]);
      setInputValue("");
    }
  };

  return (
    <Combobox.Root
      value={selectedTags}
      onValueChange={handleValueChange}
      multiple
      disabled={disabled}
    >
      <Combobox.Trigger className="flex flex-wrap gap-1.5 px-4 py-2 bg-white dark:bg-gray-800 dark:border-gray-600 focus-within:border-transparent min-h-[42px]">
        <Combobox.Value>
          {(value: string[]) => (
            <>
              <Combobox.Chips className="contents">
                {value.map((tag) => (
                  <Combobox.Chip
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm"
                  >
                    {tag}
                    <Combobox.ChipRemove
                      aria-label={`Remove ${tag}`}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer p-0.5 rounded-sm hover:bg-gray-200 dark:hover:bg-gray-600"
                      onClick={() => {
                        onTagsChange(selectedTags.filter((t) => t !== tag));
                      }}
                    ><HvX size={10} />
                    </Combobox.ChipRemove>
                  </Combobox.Chip>
                ))}
              </Combobox.Chips>
              <Combobox.Input
                value={inputValue}
                onChange={handleInputChange}
                className="flex-1 min-w-[60px] bg-transparent outline-none text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400"
                placeholder={value.length === 0 ? placeholder : ""}
                onKeyDown={(e) => {
                  if (e.key === "," || e.key === "Enter") {
                    e.preventDefault();
                    if (inputValue.trim()) {
                      // If there are filtered items, select the first one
                      if (filteredItems.length > 0) {
                        const firstTag = filteredItems[0];
                        if (!selectedTags.includes(firstTag)) {
                          onTagsChange([...selectedTags, firstTag]);
                          setInputValue("");
                        }
                      } else if (showCreateNew) {
                        handleCreateTag();
                      }
                    }
                  } else if (e.key === "Backspace" && !inputValue && selectedTags.length > 0) {
                    e.preventDefault();
                    // Remove the last tag
                    onTagsChange(selectedTags.slice(0, -1));
                  }
                }}
              />
            </>
          )}
        </Combobox.Value>
      </Combobox.Trigger>

      <Combobox.Portal>
        <Combobox.Positioner
          positionMethod="fixed"
          className="z-[10000]"
          sideOffset={4}
          align="start"
        >
          <Combobox.Popup className="w-[var(--anchor-width)] min-w-[160px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-48 overflow-y-auto outline-none py-1">
            {loading && (
              <Combobox.Empty className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                Loading tags...
              </Combobox.Empty>
            )}

            {!loading && filteredItems.length === 0 && !showCreateNew && (
              <Combobox.Empty className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                {inputValue.trim()
                  ? "No matching tags"
                  : "Type to search or create a tag"}
              </Combobox.Empty>
            )}

            {filteredItems.map((tag) => (
              <Combobox.Item
                key={tag}
                value={tag}
                className="group flex items-center justify-between px-3 py-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer outline-none hover:bg-gray-100 dark:hover:bg-gray-700 data-[selected]:bg-blue-50 dark:data-[selected]:bg-blue-900/30"
              >
                <span>{tag}</span>
                <Combobox.ItemIndicator className="text-blue-600 dark:text-blue-400 opacity-0 group-data-[selected]:opacity-100">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M13 4L6 11L3 8"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Combobox.ItemIndicator>
              </Combobox.Item>
            ))}

            {showCreateNew && (
              <Combobox.Item
                value={normalizedInput}
                className="flex items-center px-3 py-2 text-sm text-blue-600 dark:text-blue-400 cursor-pointer outline-none hover:bg-blue-50 dark:hover:bg-blue-900/20 border-t border-gray-100 dark:border-gray-700"
              >
                <span className="mr-2">+</span>
                Create tag "{normalizedInput}"
              </Combobox.Item>
            )}
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
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
