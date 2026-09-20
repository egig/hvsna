ALTER TABLE "recurring_tasks" ADD COLUMN "duration_minutes" integer DEFAULT 15 NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "duration_minutes" integer DEFAULT 15 NOT NULL;