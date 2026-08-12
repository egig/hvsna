CREATE TABLE "recurring_tasks" (
	"user_id" uuid NOT NULL,
	"id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"recurring_type" text NOT NULL,
	"recurring_interval" integer NOT NULL,
	"base_date_epoch" bigint NOT NULL,
	"at_time" text,
	"lat" double precision,
	"lng" double precision,
	"timezone" text,
	"hijri_date_offset" integer,
	"tags" text,
	"recurring_end" text,
	"recurring_end_epoch" bigint,
	"recurring_end_occurrences" integer,
	"use_gregorian" integer NOT NULL,
	"occurrence_exceptions" text,
	"created_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL,
	"deleted_at" bigint,
	"rev" bigserial NOT NULL,
	CONSTRAINT "recurring_tasks_user_id_id_pk" PRIMARY KEY("user_id","id")
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"user_id" uuid NOT NULL,
	"id" text DEFAULT 'settings' NOT NULL,
	"payload" text NOT NULL,
	"updated_at" bigint NOT NULL,
	"rev" bigserial NOT NULL,
	CONSTRAINT "settings_user_id_id_pk" PRIMARY KEY("user_id","id")
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"user_id" uuid NOT NULL,
	"id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"status" integer NOT NULL,
	"at_time" text,
	"at_epoch_millis" bigint,
	"lat" double precision,
	"lng" double precision,
	"timezone" text,
	"recurring_type" text,
	"recurring_interval" integer,
	"recurring_task_id" text,
	"hijri_date_offset" integer,
	"tags" text,
	"created_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL,
	"completed_at" bigint,
	"deleted_at" bigint,
	"rev" bigserial NOT NULL,
	CONSTRAINT "tasks_user_id_id_pk" PRIMARY KEY("user_id","id")
);
--> statement-breakpoint
ALTER TABLE "recurring_tasks" ADD CONSTRAINT "recurring_tasks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settings" ADD CONSTRAINT "settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_recurring_task_fk" FOREIGN KEY ("user_id","recurring_task_id") REFERENCES "public"."recurring_tasks"("user_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "recurring_tasks_user_rev_idx" ON "recurring_tasks" USING btree ("user_id","rev");--> statement-breakpoint
CREATE INDEX "settings_user_rev_idx" ON "settings" USING btree ("user_id","rev");--> statement-breakpoint
CREATE INDEX "tasks_user_rev_idx" ON "tasks" USING btree ("user_id","rev");