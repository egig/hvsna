CREATE TABLE `changes` (
	`seq` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`op` text NOT NULL,
	`payload` text,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `recurring_tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`recurring_type` text NOT NULL,
	`recurring_interval` integer NOT NULL,
	`base_date_epoch` integer NOT NULL,
	`at_time` text,
	`lat` real,
	`lng` real,
	`timezone` text,
	`hijri_date_offset` integer,
	`tags` text,
	`recurring_end` text,
	`recurring_end_epoch` integer,
	`recurring_end_occurrences` integer,
	`use_gregorian` integer NOT NULL,
	`occurrence_exceptions` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` text PRIMARY KEY DEFAULT 'settings' NOT NULL,
	`payload` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`status` integer NOT NULL,
	`at_time` text,
	`at_epoch_millis` integer,
	`lat` real,
	`lng` real,
	`timezone` text,
	`recurring_type` text,
	`recurring_interval` integer,
	`recurring_task_id` text,
	`hijri_date_offset` integer,
	`tags` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`completed_at` integer,
	`deleted_at` integer,
	FOREIGN KEY (`recurring_task_id`) REFERENCES `recurring_tasks`(`id`) ON UPDATE no action ON DELETE no action
);
