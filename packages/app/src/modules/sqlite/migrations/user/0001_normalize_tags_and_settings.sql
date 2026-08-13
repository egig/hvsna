CREATE TABLE `tags` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`color` text NOT NULL DEFAULT '#64748B',
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	`_dirty` integer NOT NULL DEFAULT 1
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tags_name_unique` ON `tags` (`name`) WHERE `deleted_at` IS NULL;
--> statement-breakpoint
CREATE TABLE `task_tags` (
	`task_id` text NOT NULL,
	`tag_id` text NOT NULL,
	PRIMARY KEY (`task_id`, `tag_id`),
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE CASCADE,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX `task_tags_tag_id` ON `task_tags` (`tag_id`);
--> statement-breakpoint
CREATE TABLE `recurring_task_tags` (
	`recurring_task_id` text NOT NULL,
	`tag_id` text NOT NULL,
	PRIMARY KEY (`recurring_task_id`, `tag_id`),
	FOREIGN KEY (`recurring_task_id`) REFERENCES `recurring_tasks`(`id`) ON UPDATE no action ON DELETE CASCADE,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX `recurring_task_tags_tag_id` ON `recurring_task_tags` (`tag_id`);
--> statement-breakpoint
-- Backfill: one `tags` row per distinct normalized tag name found across the
-- old `tasks.tags` / `recurring_tasks.tags` JSON array columns.
INSERT INTO tags (id, name, color, created_at, updated_at)
SELECT
	'tag_' || lower(hex(randomblob(16))),
	name,
	'#64748B',
	CAST(strftime('%s', 'now') AS INTEGER) * 1000,
	CAST(strftime('%s', 'now') AS INTEGER) * 1000
FROM (
	SELECT DISTINCT trim(lower(je.value)) AS name
	FROM tasks, json_each(tasks.tags) je
	WHERE tasks.tags IS NOT NULL AND trim(lower(je.value)) != ''
	UNION
	SELECT DISTINCT trim(lower(je.value)) AS name
	FROM recurring_tasks, json_each(recurring_tasks.tags) je
	WHERE recurring_tasks.tags IS NOT NULL AND trim(lower(je.value)) != ''
);
--> statement-breakpoint
INSERT INTO task_tags (task_id, tag_id)
SELECT DISTINCT tasks.id, tags.id
FROM tasks, json_each(tasks.tags) je
JOIN tags ON tags.name = trim(lower(je.value))
WHERE tasks.tags IS NOT NULL;
--> statement-breakpoint
INSERT INTO recurring_task_tags (recurring_task_id, tag_id)
SELECT DISTINCT recurring_tasks.id, tags.id
FROM recurring_tasks, json_each(recurring_tasks.tags) je
JOIN tags ON tags.name = trim(lower(je.value))
WHERE recurring_tasks.tags IS NOT NULL;
--> statement-breakpoint
ALTER TABLE tasks DROP COLUMN tags;
--> statement-breakpoint
ALTER TABLE recurring_tasks DROP COLUMN tags;
--> statement-breakpoint
-- settings: single JSON-blob row -> one row per top-level key, matching the
-- key/value shape used everywhere else client-only sync bookkeeping lives.
ALTER TABLE settings RENAME TO settings_legacy;
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` integer NOT NULL,
	`_dirty` integer NOT NULL DEFAULT 1
);
--> statement-breakpoint
INSERT INTO settings (key, value, updated_at)
SELECT
	je.key,
	CASE je.type
		WHEN 'text' THEN json_quote(je.value)
		WHEN 'true' THEN 'true'
		WHEN 'false' THEN 'false'
		WHEN 'null' THEN 'null'
		ELSE je.value
	END,
	settings_legacy.updated_at
FROM settings_legacy, json_each(settings_legacy.payload) je
WHERE settings_legacy.id = 'settings';
--> statement-breakpoint
DROP TABLE settings_legacy;
