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

export const DEFAULT_TAG_COLOR = "#64748B";

/** Small rotating palette assigned to newly created tags. */
export const TAG_COLOR_PALETTE = [
  "#64748B", // slate
  "#EF4444", // red
  "#F97316", // orange
  "#EAB308", // yellow
  "#22C55E", // green
  "#14B8A6", // teal
  "#3B82F6", // blue
  "#8B5CF6", // violet
  "#EC4899", // pink
] as const;

export function normalizeTagName(name: string): string {
  return name.trim().toLowerCase();
}
