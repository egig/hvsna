import { useMemo } from "react";
import { useTags } from "./use-tags";
import { DEFAULT_TAG_COLOR } from "@/domain/tag";

/**
 * Colored tag pill — the web counterpart of android's `TagPill` (TaskListItem.kt):
 * a `#name` label tinted with the tag's own color over a 15%-opacity wash of it,
 * shared by task rows and the task edit form's selected-tags row.
 */

/** `#RRGGBB` + 15% opacity → `#RRGGBBxx`; anything unexpected falls back to a flat wash. */
function washBackground(color: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(color) ? `${color}26` : color;
}

/** Maps tag name → color, defaulting unknown names to {@link DEFAULT_TAG_COLOR}. */
export function useTagColor(): (name: string) => string {
  const { tags } = useTags();
  return useMemo(() => {
    const byName = new Map(tags.map((t) => [t.name, t.color]));
    return (name: string) => byName.get(name) ?? DEFAULT_TAG_COLOR;
  }, [tags]);
}

interface TagPillProps {
  name: string;
  color: string;
  onClick?: () => void;
  onRemove?: () => void;
  className?: string;
}

export function TagPill({
  name,
  color,
  onClick,
  onRemove,
  className = "",
}: TagPillProps) {
  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium tracking-wide leading-tight ${
        onClick ? "cursor-pointer" : ""
      } ${className}`}
      style={{ backgroundColor: washBackground(color), color }}
    >
      #{name}
      {onRemove && (
        <span
          role="button"
          tabIndex={0}
          aria-label={`Remove ${name}`}
          className="cursor-pointer opacity-70 hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.stopPropagation();
              onRemove();
            }
          }}
        >
          &times;
        </span>
      )}
    </span>
  );
}

interface TagListProps {
  tags: string[];
  onTagClick?: (tag: string) => void;
  className?: string;
}

/** Renders a wrapped row of colored {@link TagPill}s for a list of tag names. */
export function TagList({ tags, onTagClick, className = "" }: TagListProps) {
  const tagColor = useTagColor();
  if (!tags || tags.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {tags.map((tag) => (
        <TagPill
          key={tag}
          name={tag}
          color={tagColor(tag)}
          onClick={onTagClick ? () => onTagClick(tag) : undefined}
        />
      ))}
    </div>
  );
}
