ALTER TABLE "settings" DROP CONSTRAINT "settings_user_id_id_pk";--> statement-breakpoint
ALTER TABLE "settings" ALTER COLUMN "key" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "settings" ALTER COLUMN "value" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "settings" ADD CONSTRAINT "settings_user_id_key_pk" PRIMARY KEY("user_id","key");--> statement-breakpoint
ALTER TABLE "recurring_tasks" DROP COLUMN "tags";--> statement-breakpoint
ALTER TABLE "settings" DROP COLUMN "id";--> statement-breakpoint
ALTER TABLE "settings" DROP COLUMN "payload";--> statement-breakpoint
ALTER TABLE "tasks" DROP COLUMN "tags";