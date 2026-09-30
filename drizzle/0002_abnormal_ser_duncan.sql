-- Hand-added: drizzle-kit only diffs tables/columns/indexes from the
-- schema, never extensions. House rule D9 needs `uuid_generate_v4()` for
-- every id; B2 (D8) needs `pg_trgm` for the trigram GIN indexes below on
-- stock/camera/lab/lab_branch.search_text. Both are on Neon's supported
-- extension list.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS pg_trgm;
--> statement-breakpoint
CREATE TABLE "bag_item" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"user_id" text NOT NULL,
	"kind" text NOT NULL,
	"ref_id" uuid NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "camera" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"owner_id" text,
	"slug" text,
	"brand" text NOT NULL,
	"model" text NOT NULL,
	"type" text,
	"format" text,
	"fixed_stock_id" uuid,
	"status" text,
	"search_text" text,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lens" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"owner_id" text NOT NULL,
	"brand" text NOT NULL,
	"model" text,
	"focal_length" text,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"owner_id" text,
	"slug" text,
	"brand" text NOT NULL,
	"name" text NOT NULL,
	"iso" integer,
	"formats" text[],
	"type" text,
	"canister_color" text,
	"canister_photo_key" text,
	"status" text,
	"search_text" text,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lab" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"owner_id" text,
	"slug" text,
	"name" text NOT NULL,
	"address" text,
	"link_url" text,
	"services" text[],
	"accepts_mail" boolean,
	"search_text" text,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lab_branch" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"lab_id" uuid NOT NULL,
	"name" text,
	"district" text,
	"area_hint" text,
	"city" text NOT NULL,
	"address" text,
	"link_url" text,
	"services" text[],
	"accepts_mail" boolean,
	"search_text" text,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roll" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"user_id" text NOT NULL,
	"stock_id" uuid NOT NULL,
	"camera_bag_item_id" uuid NOT NULL,
	"lens_id" uuid,
	"name" text,
	"canister_color" text,
	"box_iso" integer,
	"shot_iso" integer,
	"exposures" integer,
	"format" text,
	"locations" text[],
	"shot_from" timestamp with time zone,
	"shot_to" timestamp with time zone,
	"notes" text,
	"memory" text,
	"version" integer DEFAULT 1 NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "bag_item_user_id_idx" ON "bag_item" USING btree ("user_id") WHERE "bag_item"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "camera_owner_id_idx" ON "camera" USING btree ("owner_id") WHERE "camera"."deleted_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "camera_slug_idx" ON "camera" USING btree ("slug") WHERE "camera"."deleted_at" IS NULL AND "camera"."owner_id" IS NULL;--> statement-breakpoint
CREATE INDEX "camera_search_text_trgm_idx" ON "camera" USING gin ("search_text" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "lens_owner_id_idx" ON "lens" USING btree ("owner_id") WHERE "lens"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "stock_owner_id_idx" ON "stock" USING btree ("owner_id") WHERE "stock"."deleted_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "stock_slug_idx" ON "stock" USING btree ("slug") WHERE "stock"."deleted_at" IS NULL AND "stock"."owner_id" IS NULL;--> statement-breakpoint
CREATE INDEX "stock_search_text_trgm_idx" ON "stock" USING gin ("search_text" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "lab_owner_id_idx" ON "lab" USING btree ("owner_id") WHERE "lab"."deleted_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "lab_slug_idx" ON "lab" USING btree ("slug") WHERE "lab"."deleted_at" IS NULL AND "lab"."owner_id" IS NULL;--> statement-breakpoint
CREATE INDEX "lab_search_text_trgm_idx" ON "lab" USING gin ("search_text" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "lab_branch_lab_id_idx" ON "lab_branch" USING btree ("lab_id") WHERE "lab_branch"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "lab_branch_city_idx" ON "lab_branch" USING btree ("city") WHERE "lab_branch"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "lab_branch_search_text_trgm_idx" ON "lab_branch" USING gin ("search_text" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "roll_user_id_created_at_idx" ON "roll" USING btree ("user_id","created_at") WHERE "roll"."deleted_at" IS NULL;