CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"lemon_squeezy_subscription_id" text NOT NULL,
	"lemon_squeezy_customer_id" text NOT NULL,
	"lemon_squeezy_order_id" text,
	"variant_id" text NOT NULL,
	"status" text NOT NULL,
	"renews_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"trial_ends_at" timestamp with time zone,
	"card_brand" text,
	"card_last_four" text,
	"update_payment_method_url" text,
	"customer_portal_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "subscriptions_lemon_squeezy_subscription_id_unique" UNIQUE("lemon_squeezy_subscription_id")
);
--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;