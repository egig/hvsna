CREATE TABLE "sync_entities" (
	"user_id" uuid NOT NULL,
	"entity_type" text NOT NULL,
	"id" text NOT NULL,
	"payload" jsonb NOT NULL,
	"updated_at" bigint NOT NULL,
	"deleted_at" bigint,
	"rev" bigserial NOT NULL,
	CONSTRAINT "sync_entities_user_id_entity_type_id_pk" PRIMARY KEY("user_id","entity_type","id")
);
--> statement-breakpoint
ALTER TABLE "sync_entities" ADD CONSTRAINT "sync_entities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sync_entities_user_type_rev_idx" ON "sync_entities" USING btree ("user_id","entity_type","rev");--> statement-breakpoint
-- Copy every synced row into sync_entities, keeping its rev so each device's
-- stored per-table cursor stays valid. Column names already equal the wire
-- keys, so the payload is the row minus its envelope columns; tag membership
-- moves from the join tables into a `tag_ids` array.
INSERT INTO "sync_entities" ("user_id", "entity_type", "id", "payload", "updated_at", "deleted_at", "rev")
SELECT t."user_id", 'tasks', t."id",
	(to_jsonb(t) - 'user_id' - 'id' - 'updated_at' - 'deleted_at' - 'rev')
		|| jsonb_build_object('tag_ids', COALESCE(
			(SELECT jsonb_agg(tt."tag_id" ORDER BY tt."tag_id") FROM "task_tags" tt
			WHERE tt."user_id" = t."user_id" AND tt."task_id" = t."id"),
			'[]'::jsonb)),
	t."updated_at", t."deleted_at", t."rev"
FROM "tasks" t;--> statement-breakpoint
INSERT INTO "sync_entities" ("user_id", "entity_type", "id", "payload", "updated_at", "deleted_at", "rev")
SELECT r."user_id", 'recurring_tasks', r."id",
	(to_jsonb(r) - 'user_id' - 'id' - 'updated_at' - 'deleted_at' - 'rev')
		|| jsonb_build_object('tag_ids', COALESCE(
			(SELECT jsonb_agg(rt."tag_id" ORDER BY rt."tag_id") FROM "recurring_task_tags" rt
			WHERE rt."user_id" = r."user_id" AND rt."recurring_task_id" = r."id"),
			'[]'::jsonb)),
	r."updated_at", r."deleted_at", r."rev"
FROM "recurring_tasks" r;--> statement-breakpoint
INSERT INTO "sync_entities" ("user_id", "entity_type", "id", "payload", "updated_at", "deleted_at", "rev")
SELECT g."user_id", 'tags', g."id",
	to_jsonb(g) - 'user_id' - 'id' - 'updated_at' - 'deleted_at' - 'rev',
	g."updated_at", g."deleted_at", g."rev"
FROM "tags" g;--> statement-breakpoint
INSERT INTO "sync_entities" ("user_id", "entity_type", "id", "payload", "updated_at", "deleted_at", "rev")
SELECT s."user_id", 'settings', s."key",
	to_jsonb(s) - 'user_id' - 'key' - 'updated_at' - 'rev',
	s."updated_at", NULL, s."rev"
FROM "settings" s;--> statement-breakpoint
-- New revs must sort after every copied one, whichever table it came from.
SELECT setval('sync_entities_rev_seq', (SELECT COALESCE(MAX("rev"), 0) + 1 FROM "sync_entities"), false);
