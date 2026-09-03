import type { ITagRepository } from "@/domain/tag/ITagRepository";
import {
  DEFAULT_TAG_COLOR,
  normalizeTagName,
  type Tag,
  type TagUpdateInput,
  type TagWithCount,
} from "@/domain/tag";
import { generatePrefixedUUID } from "@/modules/uuid";
import type { SqliteExecutor, SqliteValue } from "@/modules/sqlite/client";
import type { WriteNotifier } from "@/modules/sync/write-notifier";

type TagRow = Record<string, SqliteValue>;

function rowToTag(row: TagRow): Tag {
  return {
    id: String(row.id),
    name: String(row.name),
    color: String(row.color),
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
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

const FIND_OR_CREATE_SQL = `
  INSERT INTO tags (id, name, color, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?)
  ON CONFLICT(name) WHERE deleted_at IS NULL DO UPDATE SET updated_at = excluded.updated_at
  RETURNING id
`;

export class SqliteTagRepository implements ITagRepository {
  constructor(
    private readonly client: SqliteExecutor,
    private readonly writeNotifier: WriteNotifier
  ) {}

  async findAll(): Promise<TagWithCount[]> {
    const rows = await this.client.run(`
      SELECT
        tags.*,
        (
          SELECT COUNT(*) FROM task_tags tt
          JOIN tasks t ON t.id = tt.task_id AND t.deleted_at IS NULL AND t.status = 0
          WHERE tt.tag_id = tags.id
        ) AS count
      FROM tags
      WHERE tags.deleted_at IS NULL
      ORDER BY tags.name ASC
    `);
    return rows.map((row) => ({ ...rowToTag(row), count: Number(row.count) }));
  }

  async findByName(name: string): Promise<Tag | null> {
    const rows = await this.client.run(
      `SELECT * FROM tags WHERE name = ? AND deleted_at IS NULL`,
      [normalizeTagName(name)]
    );
    return rows[0] ? rowToTag(rows[0]) : null;
  }

  async update(id: string, input: TagUpdateInput): Promise<Tag> {
    const rows = await this.client.run(`SELECT * FROM tags WHERE id = ? AND deleted_at IS NULL`, [id]);
    if (!rows[0]) throw new Error(`Tag ${id} not found`);
    const existing = rowToTag(rows[0]);

    const name = input.name !== undefined ? normalizeTagName(input.name) : existing.name;
    const color = input.color ?? existing.color;
    const now = Date.now();

    await this.client.run(
      `UPDATE tags SET name = ?, color = ?, updated_at = ?, _dirty = 1 WHERE id = ?`,
      [name, color, now, id]
    );
    this.writeNotifier.notify("tags");
    return { ...existing, name, color, updatedAt: now };
  }

  async delete(id: string): Promise<void> {
    const now = Date.now();
    // Soft-delete (for future sync propagation, matching Task/RecurringTask)
    // doesn't cascade through the FKs, so the join rows are cleared explicitly —
    // deleting a tag removes it from every task/recurring task that had it.
    await this.client.run(`DELETE FROM task_tags WHERE tag_id = ?`, [id]);
    await this.client.run(`DELETE FROM recurring_task_tags WHERE tag_id = ?`, [id]);
    await this.client.run(
      `UPDATE tags SET deleted_at = ?, updated_at = ?, _dirty = 1 WHERE id = ?`,
      [now, now, id]
    );
    this.writeNotifier.notify("tags");
  }

  private async findOrCreateTagId(name: string): Promise<string> {
    const rows = await this.client.run(FIND_OR_CREATE_SQL, [
      generatePrefixedUUID("tag_"),
      name,
      DEFAULT_TAG_COLOR,
      Date.now(),
      Date.now(),
    ]);
    return String(rows[0].id);
  }

  async setTaskTags(taskId: string, tagNames: string[]): Promise<void> {
    const normalized = dedupeNormalized(tagNames);
    await this.client.run(`DELETE FROM task_tags WHERE task_id = ?`, [taskId]);
    for (const name of normalized) {
      const tagId = await this.findOrCreateTagId(name);
      await this.client.run(`INSERT OR IGNORE INTO task_tags (task_id, tag_id) VALUES (?, ?)`, [
        taskId,
        tagId,
      ]);
    }
  }

  async setRecurringTaskTags(recurringTaskId: string, tagNames: string[]): Promise<void> {
    const normalized = dedupeNormalized(tagNames);
    await this.client.run(`DELETE FROM recurring_task_tags WHERE recurring_task_id = ?`, [
      recurringTaskId,
    ]);
    for (const name of normalized) {
      const tagId = await this.findOrCreateTagId(name);
      await this.client.run(
        `INSERT OR IGNORE INTO recurring_task_tags (recurring_task_id, tag_id) VALUES (?, ?)`,
        [recurringTaskId, tagId]
      );
    }
  }

  async getTagsForTasks(taskIds: string[]): Promise<Map<string, string[]>> {
    const result = new Map<string, string[]>();
    if (taskIds.length === 0) return result;

    const rows = await this.client.run(
      `SELECT tt.task_id AS entityId, tags.name AS name
       FROM task_tags tt
       JOIN tags ON tags.id = tt.tag_id AND tags.deleted_at IS NULL
       WHERE tt.task_id IN (${taskIds.map(() => "?").join(",")})
       ORDER BY tags.name ASC`,
      taskIds
    );
    for (const row of rows) {
      const entityId = String(row.entityId);
      const list = result.get(entityId) ?? [];
      list.push(String(row.name));
      result.set(entityId, list);
    }
    return result;
  }

  async getTagsForRecurringTasks(recurringTaskIds: string[]): Promise<Map<string, string[]>> {
    const result = new Map<string, string[]>();
    if (recurringTaskIds.length === 0) return result;

    const rows = await this.client.run(
      `SELECT rtt.recurring_task_id AS entityId, tags.name AS name
       FROM recurring_task_tags rtt
       JOIN tags ON tags.id = rtt.tag_id AND tags.deleted_at IS NULL
       WHERE rtt.recurring_task_id IN (${recurringTaskIds.map(() => "?").join(",")})
       ORDER BY tags.name ASC`,
      recurringTaskIds
    );
    for (const row of rows) {
      const entityId = String(row.entityId);
      const list = result.get(entityId) ?? [];
      list.push(String(row.name));
      result.set(entityId, list);
    }
    return result;
  }
}
