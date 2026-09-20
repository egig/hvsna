ALTER TABLE `tasks` ADD COLUMN `duration_minutes` integer NOT NULL DEFAULT 15;
--> statement-breakpoint
ALTER TABLE `recurring_tasks` ADD COLUMN `duration_minutes` integer NOT NULL DEFAULT 15;
