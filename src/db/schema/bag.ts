import { sql } from "drizzle-orm";
import { index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * BAG-1: the túi. `kind` says which catalogue-shaped table `ref_id` points
 * into (`camera`, `lens` or `stock`) — no foreign key (house rules, D9),
 * so every read has to branch on `kind` itself. `user_id` is a bare
 * Better Auth user id (`text`, D9); removing an item is a soft delete
 * (`deleted_at`), so B4's `removeFromBag` never hard-deletes.
 *
 * BAG-2 (Round 2, migration 0003): `qty` and `expiry_year` only mean
 * anything for a `kind: "stock"` row (the film pocket) — `null` on a
 * camera/lens row, and `null` on a stock row too, for "not counted" (the
 * bag item exists but nobody's tracked how many are left). `qty` is
 * decremented, never negative; `expiry_year` is a plain year for expired
 * film, no month.
 */
export const bagItem = pgTable(
  "bag_item",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`uuid_generate_v4()`),
    userId: text("user_id").notNull(),
    kind: text("kind", { enum: ["camera", "lens", "stock"] }).notNull(),
    refId: uuid("ref_id").notNull(),
    qty: integer("qty"),
    expiryYear: integer("expiry_year"),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("bag_item_user_id_idx").on(table.userId).where(sql`${table.deletedAt} IS NULL`),
  ],
);
