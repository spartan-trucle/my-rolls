ALTER TABLE "bag_item" ADD COLUMN "qty" integer;--> statement-breakpoint
ALTER TABLE "bag_item" ADD COLUMN "expiry_year" integer;--> statement-breakpoint
ALTER TABLE "roll" ADD COLUMN "number" integer;--> statement-breakpoint
ALTER TABLE "roll" ADD COLUMN "date_precision" text;--> statement-breakpoint
-- Hand-added: drizzle-kit only diffs schema shape, never backfills data.
-- R2-5 needs every existing roll to get a stable per-user number before
-- the unique partial index below can be created — oldest `created_at`
-- first, across every row (including soft-deleted ones, so a number a
-- deleted roll used is never handed out again). `createRollCore` extends
-- this same numbering going forward (`MAX(number) + 1` per user, over
-- every row).
UPDATE "roll" AS r
SET "number" = numbered."rn"
FROM (
	SELECT "id", ROW_NUMBER() OVER (PARTITION BY "user_id" ORDER BY "created_at") AS "rn"
	FROM "roll"
) AS numbered
WHERE r."id" = numbered."id";
--> statement-breakpoint
CREATE UNIQUE INDEX "roll_user_id_number_idx" ON "roll" USING btree ("user_id","number") WHERE "roll"."deleted_at" IS NULL;
