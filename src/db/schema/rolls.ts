import { sql } from "drizzle-orm";
import { index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

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
 * `name`, `canister_color`, `notes` and `memory` are the pre-Phase-1 ADR
 * columns, unchanged; `version` drives share-image cache busting.
 *
 * House rules (D9): `uuid_generate_v4()` id, no foreign keys — `stock_id`,
 * `camera_bag_item_id` and `lens_id` are bare ids the caller must
 * owner-check itself (B6) — `user_id` is a bare Better Auth id (`text`),
 * soft deletes, partial index, `timestamptz`.
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
    name: text("name"),
    canisterColor: text("canister_color"),
    boxIso: integer("box_iso"),
    shotIso: integer("shot_iso"),
    exposures: integer("exposures"),
    format: text("format"),
    locations: text("locations").array(),
    shotFrom: timestamp("shot_from", { withTimezone: true }),
    shotTo: timestamp("shot_to", { withTimezone: true }),
    notes: text("notes"),
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
  ],
);
