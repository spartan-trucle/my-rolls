import { sql } from "drizzle-orm";
import { index, integer, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

/**
 * `stock` and `camera` are the seeded catalogue (CAT-1) plus each user's
 * private custom entries (CAT-2); `lens` is custom-only (D3: no seeded lens
 * catalogue in the MVP).
 *
 * House rules (D9, ADR-001): `uuid_generate_v4()` ids (needs `uuid-ossp`,
 * enabled in migration 0002), no foreign keys — `owner_id` is a bare
 * Better Auth user id (`user.id` is `text`, D9) — soft deletes via
 * `deleted_at`, partial indexes `WHERE deleted_at IS NULL`, every
 * timestamp `timestamptz`.
 *
 * `owner_id` null means seeded catalogue; set means private to that user
 * (catalogue.md: "`owner_id` null = seeded catalogue; set = private
 * custom"). `slug` is the natural key the seed script (B3) upserts on
 * (`brand-name-iso`); the partial unique index only covers seeded rows
 * (`owner_id IS NULL`) since custom entries don't carry a slug.
 * `search_text` is filled on write by `toSearchText()` (D8, B2) and
 * indexed with a trigram GIN index for accent-free search (CAT-1).
 */
export const stock = pgTable(
  "stock",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`uuid_generate_v4()`),
    ownerId: text("owner_id"),
    slug: text("slug"),
    brand: text("brand").notNull(),
    name: text("name").notNull(),
    // ISO on the box. Nullable: a custom entry (CAT-2, a re-spool or
    // expired roll) might not know it.
    iso: integer("iso"),
    // D4: `text[]`, not a single format — one stock can come in 35mm and
    // 120 (PRD `format[]` wins over the ADR's single `format`).
    formats: text("formats").array(),
    // color-negative | slide | bw | cine | special-effect | instant
    // (seed-catalogue.md's `type` column). Plain text, not a pg enum: no
    // seeded row has ever needed a value outside that set, and CAT-2
    // custom entries shouldn't be blocked by a DB-level enum change.
    type: text("type"),
    // gold | green | blue | mono | rose (design system `stock-*` colour
    // families).
    canisterColor: text("canister_color"),
    canisterPhotoKey: text("canister_photo_key"),
    // current | discontinued (seed-catalogue.md: discontinued stocks stay
    // seeded because past rolls, ROLL-2, still use them).
    status: text("status"),
    searchText: text("search_text"),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("stock_owner_id_idx").on(table.ownerId).where(sql`${table.deletedAt} IS NULL`),
    uniqueIndex("stock_slug_idx")
      .on(table.slug)
      .where(sql`${table.deletedAt} IS NULL AND ${table.ownerId} IS NULL`),
    index("stock_search_text_trgm_idx").using("gin", sql`${table.searchText} gin_trgm_ops`),
  ],
);

/**
 * D20: `fixed_stock_id` is nullable and points at a `stock.id` with no
 * foreign key (house rules, D9) — set only for single-use cameras
 * (Kodak FunSaver and similar, seed-catalogue.md#single-use). Picking one
 * of these in the roll form fills its film and locks it (B6, out of scope
 * here).
 */
export const camera = pgTable(
  "camera",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`uuid_generate_v4()`),
    ownerId: text("owner_id"),
    slug: text("slug"),
    brand: text("brand").notNull(),
    model: text("model").notNull(),
    // slr | rangefinder | point-and-shoot | half-frame | tlr |
    // medium-format | toy | single-use (seed-catalogue.md).
    type: text("type"),
    format: text("format"),
    fixedStockId: uuid("fixed_stock_id"),
    status: text("status"),
    searchText: text("search_text"),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("camera_owner_id_idx").on(table.ownerId).where(sql`${table.deletedAt} IS NULL`),
    uniqueIndex("camera_slug_idx")
      .on(table.slug)
      .where(sql`${table.deletedAt} IS NULL AND ${table.ownerId} IS NULL`),
    index("camera_search_text_trgm_idx").using("gin", sql`${table.searchText} gin_trgm_ops`),
  ],
);

/**
 * D3: lenses are custom entries only — no seeded lens catalogue in the
 * MVP, so `owner_id` is required (never null) and there's no `slug` or
 * `search_text`: nothing seeds lenses, and BAG-1's lens row is filled by
 * name, not searched.
 */
export const lens = pgTable(
  "lens",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`uuid_generate_v4()`),
    ownerId: text("owner_id").notNull(),
    brand: text("brand").notNull(),
    model: text("model"),
    focalLength: text("focal_length"),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("lens_owner_id_idx").on(table.ownerId).where(sql`${table.deletedAt} IS NULL`)],
);
