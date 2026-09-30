import { sql } from "drizzle-orm";
import { index, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { MISTAKE_TYPES } from "@/features/mistakes/types";

export { MISTAKE_TYPES, type TMistakeType } from "@/features/mistakes/types";

/**
 * Phase 2 plan D6 (NOTE-1): several timestamped notes per roll or frame. `frame_id` null =
 * a note on the whole roll. `updated_at` is the "edited" time the notes list shows. The
 * longer memory stays on `roll.memory`.
 */
export const note = pgTable(
  "note",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`uuid_generate_v4()`),
    userId: text("user_id").notNull(),
    rollId: uuid("roll_id").notNull(),
    frameId: uuid("frame_id"),
    body: text("body").notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("note_roll_id_created_at_idx").on(table.rollId, table.createdAt).where(sql`${table.deletedAt} IS NULL`),
  ],
);


/**
 * Phase 2 plan D4, D5 (NOTE-2, Known conflict #4): one row per mistake type on a frame, or on
 * the whole roll when `frame_id` is null, each with an optional note. A frame is oops when it
 * has at least one live row. BAG-3, NOTE-4 and CAT-5 count these.
 */
export const mistake = pgTable(
  "mistake",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`uuid_generate_v4()`),
    userId: text("user_id").notNull(),
    rollId: uuid("roll_id").notNull(),
    frameId: uuid("frame_id"),
    type: text("type", { enum: MISTAKE_TYPES }).notNull(),
    note: text("note"),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // One live row per type on a frame or on the roll. Drizzle's index builder has no
    // NULLS NOT DISTINCT, so the nil uuid stands in for "the whole roll".
    uniqueIndex("mistake_roll_frame_type_idx")
      .on(table.rollId, sql`coalesce(${table.frameId}, '00000000-0000-0000-0000-000000000000'::uuid)`, table.type)
      .where(sql`${table.deletedAt} IS NULL`),
    index("mistake_roll_id_idx").on(table.rollId).where(sql`${table.deletedAt} IS NULL`),
  ],
);
