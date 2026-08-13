import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { normalizeTagName } from "@/domain/tag";
import { useTagRepository } from "./use-tag-repository";
import { queryKeys } from "../query-keys";
import log from "../logger";

export interface TagInfo {
  id: string;
  name: string;
  color: string;
  count: number;
}

export interface UseTagsOptions {
  limit?: number;
}

export function useTags(options?: UseTagsOptions) {
  const tagRepo = useTagRepository();
  const queryClient = useQueryClient();
  const limit = options?.limit;

  const tagsQuery = useQuery({
    queryKey: queryKeys.tags(),
    queryFn: () => tagRepo.findAll(),
  });

  const allTags = useMemo(() => tagsQuery.data ?? [], [tagsQuery.data]);
  const tags = useMemo<TagInfo[]>(
    () => (limit && allTags.length > limit ? allTags.slice(0, limit) : allTags),
    [allTags, limit]
  );
  const tagNames = useMemo(() => tags.map((t) => t.name), [tags]);

  const refreshTags = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.tags() });
    queryClient.invalidateQueries({ queryKey: queryKeys.allTasks() });
    queryClient.invalidateQueries({ queryKey: ["browsed-tasks"] });
  }, [queryClient]);

  const renameTag = useCallback(
    async (oldName: string, newName: string): Promise<void> => {
      const normalizedNew = normalizeTagName(newName);
      if (!normalizedNew || oldName === normalizedNew) return;

      const existing = allTags.find((t) => t.name === oldName);
      if (!existing) return;

      try {
        await tagRepo.update(existing.id, { name: normalizedNew });
      } catch (err) {
        log.error(`Failed to rename tag ${oldName}:`, err);
        throw err;
      }
      refreshTags();
    },
    [allTags, tagRepo, refreshTags]
  );

  const setTagColor = useCallback(
    async (tagName: string, color: string): Promise<void> => {
      const existing = allTags.find((t) => t.name === tagName);
      if (!existing) return;

      try {
        await tagRepo.update(existing.id, { color });
      } catch (err) {
        log.error(`Failed to recolor tag ${tagName}:`, err);
        throw err;
      }
      refreshTags();
    },
    [allTags, tagRepo, refreshTags]
  );

  const deleteTag = useCallback(
    async (tagName: string): Promise<void> => {
      const existing = allTags.find((t) => t.name === tagName);
      if (!existing) return;

      try {
        await tagRepo.delete(existing.id);
      } catch (err) {
        log.error(`Failed to delete tag ${tagName}:`, err);
        throw err;
      }
      refreshTags();
    },
    [allTags, tagRepo, refreshTags]
  );

  return {
    tags,
    tagNames,
    loading: tagsQuery.isPending,
    error: tagsQuery.error
      ? tagsQuery.error instanceof Error
        ? tagsQuery.error.message
        : "Unknown error"
      : null,
    refreshTags,
    renameTag,
    setTagColor,
    deleteTag,
  };
}

export function normalizeTag(tag: string): string {
  return normalizeTagName(tag);
}
