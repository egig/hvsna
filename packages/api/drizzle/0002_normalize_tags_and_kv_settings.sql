CREATE TABLE "recurring_task_tags" (
	"user_id" uuid NOT NULL,
	"recurring_task_id" text NOT NULL,
	"tag_id" text NOT NULL,
	CONSTRAINT "recurring_task_tags_user_id_recurring_task_id_tag_id_pk" PRIMARY KEY("user_id","recurring_task_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"user_id" uuid NOT NULL,
	"id" text NOT NULL,
	"name" text NOT NULL,
	"color" text NOT NULL,
	"created_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL,
	"deleted_at" bigint,
	"rev" bigserial NOT NULL,
	CONSTRAINT "tags_user_id_id_pk" PRIMARY KEY("user_id","id")
);
--> statement-breakpoint
CREATE TABLE "task_tags" (
	"user_id" uuid NOT NULL,
	"task_id" text NOT NULL,
	"tag_id" text NOT NULL,
	CONSTRAINT "task_tags_user_id_task_id_tag_id_pk" PRIMARY KEY("user_id","task_id","tag_id")
);
--> statement-breakpoint
ALTER TABLE "settings" ALTER COLUMN "payload" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "key" text;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "value" text;--> statement-breakpoint
ALTER TABLE "recurring_task_tags" ADD CONSTRAINT "recurring_task_tags_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_task_tags" ADD CONSTRAINT "recurring_task_tags_recurring_task_fk" FOREIGN KEY ("user_id","recurring_task_id") REFERENCES "public"."recurring_tasks"("user_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_task_tags" ADD CONSTRAINT "recurring_task_tags_tag_fk" FOREIGN KEY ("user_id","tag_id") REFERENCES "public"."tags"("user_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_tags" ADD CONSTRAINT "task_tags_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_tags" ADD CONSTRAINT "task_tags_task_fk" FOREIGN KEY ("user_id","task_id") REFERENCES "public"."tasks"("user_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_tags" ADD CONSTRAINT "task_tags_tag_fk" FOREIGN KEY ("user_id","tag_id") REFERENCES "public"."tags"("user_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "recurring_task_tags_tag_idx" ON "recurring_task_tags" USING btree ("user_id","tag_id");--> statement-breakpoint
CREATE INDEX "tags_user_rev_idx" ON "tags" USING btree ("user_id","rev");--> statement-breakpoint
CREATE INDEX "task_tags_tag_idx" ON "task_tags" USING btree ("user_id","tag_id");