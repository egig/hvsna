import type { ITagRepository } from "@/domain/tag/ITagRepository";
import {
  DEFAULT_TAG_COLOR,
  normalizeTagName,
  type Tag,
  type TagUpdateInput,
  type TagWithCount,
} from "@/domain/tag";
import { generatePrefixedUUID } from "@/modules/uuid";
import type { DbExecutor } from "@/modules/db/executor";
import type { TagRow } from "@/modules/db/database";
import type { WriteNotifier } from "@/modules/sync/write-notifier";

function rowToTag(row: TagRow): Tag {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function dedupeNormalized(names: string[]): string[] {
  const seen = new Set<string>();
  for (const name of names) {
    const normalized = normalizeTagName(name);
    if (normalized) seen.add(normalized);
  }
  return Array.from(seen);
}

const isLive = (row: TagRow | undefined): row is TagRow => !!row && row.deleted_at === null;

/**
 * Groups `links` (entity id → tag id) into entity id → live tag names, each
 * list sorted by name. Entities without a live tag are left out of the map.
 */
async function tagNamesByEntity(
  executor: DbExecutor,
  links: { entityId: string; tagId: string }[]
): Promise<Map<string, string[]>> {
  const result = new Map<string, string[]>();
  const tagIds = [...new Set(links.map((link) => link.tagId))];
  const tags = await executor.db.tags.bulkGet(tagIds);
  const names = new Map(tags.filter(isLive).map((tag) => [tag.id, tag.name]));
  for (const { entityId, tagId } of links) {
    const name = names.get(tagId);
    if (name === undefined) continue;
    const list = result.get(entityId) ?? [];
    list.push(name);
    result.set(entityId, list);
  }
  for (const list of result.values()) list.sort();
  return result;
}

export class DexieTagRepository implements ITagRepository {
  constructor(
    private readonly executor: DbExecutor,
    private readonly writeNotifier: WriteNotifier
  ) {}

  private get db() {
    return this.executor.db;
  }

  async findAll(): Promise<TagWithCount[]> {
    return this.executor.transaction(async () => {
      const tags = (await this.db.tags.orderBy("name").toArray()).filter(isLive);
      const links = await this.db.task_tags
        .where("tag_id")
        .anyOf(tags.map((tag) => tag.id))
        .toArray();
      const tasks = await this.db.tasks.bulkGet([...new Set(links.map((link) => link.task_id))]);
      const pendingTaskIds = new Set(
        tasks
          .filter((task) => task && task.deleted_at === null && task.status === 0)
          .map((task) => task!.id)
      );
      const counts = new Map<string, number>();
      for (const link of links) {
        if (!pendingTaskIds.has(link.task_id)) continue;
        counts.set(link.tag_id, (counts.get(link.tag_id) ?? 0) + 1);
      }
      return tags.map((tag) => ({ ...rowToTag(tag), count: counts.get(tag.id) ?? 0 }));
    });
  }

  async findByName(name: string): Promise<Tag | null> {
    const row = await this.findLiveByName(normalizeTagName(name));
    return row ? rowToTag(row) : null;
  }

  private findLiveByName(name: string): Promise<TagRow | undefined> {
    return this.db.tags.where("name").equals(name).filter(isLive).first();
  }

  async update(id: string, input: TagUpdateInput): Promise<Tag> {
    return this.executor.transaction((executor) =>
      new DexieTagRepository(executor, this.writeNotifier).updateInTransaction(id, input)
    );
  }

  private async updateInTransaction(id: string, input: TagUpdateInput): Promise<Tag> {
    const row = await this.db.tags.get(id);
    if (!isLive(row)) throw new Error(`Tag ${id} not found`);
    const existing = rowToTag(row);

    const name = input.name !== undefined ? normalizeTagName(input.name) : existing.name;
    const color = input.color ?? existing.color;
    const now = Date.now();

    // Live tag names are unique — the same name must always resolve to one tag.
    const clash = await this.findLiveByName(name);
    if (clash && clash.id !== id) throw new Error(`Tag "${name}" already exists`);

    await this.db.tags.update(id, { name, color, updated_at: now, _dirty: 1 });
    this.executor.afterCommit(() => this.writeNotifier.notify("tags"));
    return { ...existing, name, color, updatedAt: now };
  }

  async delete(id: string): Promise<void> {
    return this.executor.transaction((executor) =>
      new DexieTagRepository(executor, this.writeNotifier).deleteInTransaction(id)
    );
  }

  private async deleteInTransaction(id: string): Promise<void> {
    const now = Date.now();
    // A soft-deleted tag (kept so the deletion syncs) is removed from every
    // task/recurring task that had it.
    await this.db.task_tags.where("tag_id").equals(id).delete();
    await this.db.recurring_task_tags.where("tag_id").equals(id).delete();
    await this.db.tags.update(id, { deleted_at: now, updated_at: now, _dirty: 1 });
    this.executor.afterCommit(() => this.writeNotifier.notify("tags"));
  }

  private async findOrCreateTagId(name: string): Promise<string> {
    const existing = await this.findLiveByName(name);
    if (existing) return existing.id;
    const now = Date.now();
    const id = generatePrefixedUUID("tag_");
    await this.db.tags.add({
      id,
      name,
      color: DEFAULT_TAG_COLOR,
      created_at: now,
      updated_at: now,
      deleted_at: null,
      _dirty: 1,
    });
    return id;
  }

  async setTaskTags(taskId: string, tagNames: string[]): Promise<void> {
    return this.executor.transaction((executor) =>
      new DexieTagRepository(executor, this.writeNotifier).setTaskTagsInTransaction(taskId, tagNames)
    );
  }

  private async setTaskTagsInTransaction(taskId: string, tagNames: string[]): Promise<void> {
    await this.db.task_tags.where("task_id").equals(taskId).delete();
    for (const name of dedupeNormalized(tagNames)) {
      const tagId = await this.findOrCreateTagId(name);
      await this.db.task_tags.put({ task_id: taskId, tag_id: tagId });
    }
  }

  async setRecurringTaskTags(recurringTaskId: string, tagNames: string[]): Promise<void> {
    return this.executor.transaction((executor) =>
      new DexieTagRepository(executor, this.writeNotifier).setRecurringTaskTagsInTransaction(
        recurringTaskId,
        tagNames
      )
    );
  }

  private async setRecurringTaskTagsInTransaction(
    recurringTaskId: string,
    tagNames: string[]
  ): Promise<void> {
    await this.db.recurring_task_tags.where("recurring_task_id").equals(recurringTaskId).delete();
    for (const name of dedupeNormalized(tagNames)) {
      const tagId = await this.findOrCreateTagId(name);
      await this.db.recurring_task_tags.put({ recurring_task_id: recurringTaskId, tag_id: tagId });
    }
  }

  async getTagsForTasks(taskIds: string[]): Promise<Map<string, string[]>> {
    if (taskIds.length === 0) return new Map();
    const links = await this.db.task_tags.where("task_id").anyOf(taskIds).toArray();
    return tagNamesByEntity(
      this.executor,
      links.map((link) => ({ entityId: link.task_id, tagId: link.tag_id }))
    );
  }

  async getTagsForRecurringTasks(recurringTaskIds: string[]): Promise<Map<string, string[]>> {
    if (recurringTaskIds.length === 0) return new Map();
    const links = await this.db.recurring_task_tags
      .where("recurring_task_id")
      .anyOf(recurringTaskIds)
      .toArray();
    return tagNamesByEntity(
      this.executor,
      links.map((link) => ({ entityId: link.recurring_task_id, tagId: link.tag_id }))
    );
  }
}
