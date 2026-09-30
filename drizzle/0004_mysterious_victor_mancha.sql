CREATE TABLE "mistake" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"user_id" text NOT NULL,
	"roll_id" uuid NOT NULL,
	"frame_id" uuid,
	"type" text NOT NULL,
	"note" text,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "note" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"user_id" text NOT NULL,
	"roll_id" uuid NOT NULL,
	"frame_id" uuid,
	"body" text NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "frame" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"user_id" text NOT NULL,
	"roll_id" uuid NOT NULL,
	"scan_set_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"file_name" text NOT NULL,
	"content_type" text NOT NULL,
	"bytes" integer NOT NULL,
	"sha256" text,
	"width" integer,
	"height" integer,
	"exif" jsonb,
	"original_key" text NOT NULL,
	"grid_key" text NOT NULL,
	"view_key" text NOT NULL,
	"is_keeper" boolean DEFAULT false NOT NULL,
	"is_blank" boolean DEFAULT false NOT NULL,
	"alt_text" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scan_set" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"user_id" text NOT NULL,
	"roll_id" uuid NOT NULL,
	"lab_id" uuid,
	"lab_branch_id" uuid,
	"received_at" timestamp with time zone,
	"dropped_at" timestamp with time zone,
	"process" text,
	"push_pull_thirds" smallint,
	"scanner" text,
	"resolution_px" integer,
	"file_format" text,
	"price_vnd" integer,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "mistake_roll_frame_type_idx" ON "mistake" USING btree ("roll_id",coalesce("frame_id", '00000000-0000-0000-0000-000000000000'::uuid),"type") WHERE "mistake"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "mistake_roll_id_idx" ON "mistake" USING btree ("roll_id") WHERE "mistake"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "note_roll_id_created_at_idx" ON "note" USING btree ("roll_id","created_at") WHERE "note"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "frame_roll_id_position_idx" ON "frame" USING btree ("roll_id","position") WHERE "frame"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "frame_user_id_is_keeper_created_at_idx" ON "frame" USING btree ("user_id","is_keeper","created_at") WHERE "frame"."deleted_at" IS NULL AND "frame"."status" = 'ready';--> statement-breakpoint
CREATE INDEX "frame_pending_created_at_idx" ON "frame" USING btree ("created_at") WHERE "frame"."deleted_at" IS NULL AND "frame"."status" = 'pending';--> statement-breakpoint
CREATE UNIQUE INDEX "scan_set_roll_id_idx" ON "scan_set" USING btree ("roll_id") WHERE "scan_set"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "scan_set_user_id_idx" ON "scan_set" USING btree ("user_id") WHERE "scan_set"."deleted_at" IS NULL;--> statement-breakpoint
-- Hand-added guard (Phase 2 plan B1): Phase 1 never writes roll.notes, and notes now live in
-- the note table (D6). If any roll does hold text there, fail the deploy instead of losing it.
DO $$
BEGIN
	IF EXISTS (SELECT 1 FROM "roll" WHERE "notes" IS NOT NULL AND btrim("notes") <> '') THEN
		RAISE EXCEPTION 'roll.notes holds text; move it into the note table before migration 0004';
	END IF;
END $$;
--> statement-breakpoint
ALTER TABLE "roll" DROP COLUMN "notes";