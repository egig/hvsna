export interface Tag {
  id: string;
  name: string;
  color: string;
  createdAt: number;
  updatedAt: number;
}

export interface TagWithCount extends Tag {
  /** Number of non-deleted tasks + recurring task templates carrying this tag. */
  count: number;
}

export interface TagUpdateInput {
  name?: string;
  color?: string;
}

/** Color every newly created tag gets — kept identical to android's `TaskViewModel.createTag`. */
export const DEFAULT_TAG_COLOR = "#4B4953";

/** Small rotating palette assigned to newly created tags — mirrors android's TagPalette (Color.kt). */
export const TAG_COLOR_PALETTE = [
  "#E57373", // red
  "#FFB74D", // orange
  "#FFD54F", // amber
  "#81C784", // green
  "#4DB6AC", // teal
  "#64B5F6", // blue
  "#9575CD", // purple
  "#F06292", // pink
  "#A1887F", // brown
  "#90A4AE", // blue grey
] as const;

export function normalizeTagName(name: string): string {
  return name.trim().toLowerCase();
}
