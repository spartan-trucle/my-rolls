import { sql } from "drizzle-orm";
import { index, integer, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

/**
 * D1 (Known conflict #6): adds the nullable columns ROLL-1 lists as
 * optional fields and computes push/pull from (`box_iso`, `shot_iso`,
 * `exposures`, `format`, `lens_id`, `locations`, `shot_from`, `shot_to`).
 * Push/pull itself is **computed** (`pushPullStops()`, D17, B6), not
 * stored.
 *
 * D2: `camera_bag_item_id` points at the owner's specific `bag_item` (the
 * body), not the catalogue `camera` row — so two bodies of the same model
 * stay apart, and BAG-3's per-camera stats (later) can group by it.
 *
 * `lens_id` points straight at `lens.id` (not a bag item): unlike the
 * camera, ROLL-1 doesn't need to tell two lenses of the same catalogue
 * entry apart, and D3's lenses have no catalogue counterpart to alias
 * anyway.
 *
 * `name`, `canister_color` and `memory` are the pre-Phase-1 ADR columns;
 * `version` drives share-image cache busting. `notes` was dropped in
 * migration 0004: notes live in the `note` table (Phase 2 plan D6).
 *
 * House rules (D9): `uuid_generate_v4()` id, no foreign keys — `stock_id`,
 * `camera_bag_item_id` and `lens_id` are bare ids the caller must
 * owner-check itself (B6) — `user_id` is a bare Better Auth id (`text`),
 * soft deletes, partial index, `timestamptz`.
 *
 * Round 2 (migration 0003): `number` is the per-user "Cuộn #N" (R2-5),
 * assigned once at creation (`createRollCore`) and never reused — the
 * unique partial index below enforces that per live roll, and the
 * migration backfills it for every row that existed before this column,
 * oldest `created_at` first. Nullable in the schema (D9: additive-only,
 * no default-value backfill trick needed for the `ADD COLUMN`), but every
 * row has one after the migration's backfill and every future insert sets
 * it. `date_precision` (R2-4) says whether `shot_from`/`shot_to` are an
 * exact day (`"day"`), a month picked in past mode (`"month"`), or
 * unknown ("Không nhớ", `null` — same as both dates being `null`).
 */
export const roll = pgTable(
  "roll",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`uuid_generate_v4()`),
    userId: text("user_id").notNull(),
    stockId: uuid("stock_id").notNull(),
    cameraBagItemId: uuid("camera_bag_item_id").notNull(),
    lensId: uuid("lens_id"),
    number: integer("number"),
    name: text("name"),
    canisterColor: text("canister_color"),
    boxIso: integer("box_iso"),
    shotIso: integer("shot_iso"),
    exposures: integer("exposures"),
    format: text("format"),
    locations: text("locations").array(),
    shotFrom: timestamp("shot_from", { withTimezone: true }),
    shotTo: timestamp("shot_to", { withTimezone: true }),
    datePrecision: text("date_precision", { enum: ["day", "month"] }),
    memory: text("memory"),
    version: integer("version").notNull().default(1),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Backs `listRolls` (D15: newest first, owner-scoped) and every other
    // per-owner query (D9: no FKs, no RLS, so every query filters by
    // owner).
    index("roll_user_id_created_at_idx")
      .on(table.userId, table.createdAt)
      .where(sql`${table.deletedAt} IS NULL`),
    // R2-5: a live roll number is never reused for the same user. Soft-
    // deleted rows (excluded by the `WHERE`) keep their old number so a
    // freed slot never gets handed out again either — `createRollCore`
    // takes `MAX(number)` over every row, deleted or not.
    uniqueIndex("roll_user_id_number_idx")
      .on(table.userId, table.number)
      .where(sql`${table.deletedAt} IS NULL`),
  ],
);
