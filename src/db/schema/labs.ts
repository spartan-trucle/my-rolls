import { sql } from "drizzle-orm";
import { boolean, index, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

/**
 * D5 (Known conflict #6): `address`, `link_url`, `services text[]` and
 * `accepts_mail` are added to both `lab` and `lab_branch`, as the plan
 * decides — a lab and its branches can each carry these, since LAB-2's
 * custom lab is really "one lab, one branch" and either level may know
 * them. `owner_id` null = seeded directory (LAB-1); set = a user's
 * private custom lab (LAB-2), never shown to anyone else. `slug` is the
 * seed script's natural key (B3b, out of scope for B1–B3 but the column
 * ships now so B3b doesn't need another migration), unique only among
 * seeded rows. `search_text` (D8) is trigram-indexed for accent-free
 * search (LAB-1: "da nang" finds "Đà Nẵng").
 *
 * House rules (D9): `uuid_generate_v4()` ids, no foreign keys — `lab_id`
 * on `lab_branch` is a bare id, not a `references()` — soft deletes,
 * partial indexes, `timestamptz`.
 */
export const lab = pgTable(
  "lab",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`uuid_generate_v4()`),
    ownerId: text("owner_id"),
    slug: text("slug"),
    name: text("name").notNull(),
    address: text("address"),
    linkUrl: text("link_url"),
    services: text("services").array(),
    acceptsMail: boolean("accepts_mail"),
    searchText: text("search_text"),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("lab_owner_id_idx").on(table.ownerId).where(sql`${table.deletedAt} IS NULL`),
    uniqueIndex("lab_slug_idx")
      .on(table.slug)
      .where(sql`${table.deletedAt} IS NULL AND ${table.ownerId} IS NULL`),
    index("lab_search_text_trgm_idx").using("gin", sql`${table.searchText} gin_trgm_ops`),
  ],
);

/**
 * `district` holds the **new phường** (the 2025 reform removed quận);
 * `area_hint` keeps the old quận ("Q.1") for display, because most
 * sources still use it (D5). `name` is the branch label from the seed
 * research (e.g. "Q.1", "Giảng Võ") — the D11 starter seed and B3b are
 * out of scope here, but the column ships with the rest of D5.
 */
export const labBranch = pgTable(
  "lab_branch",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`uuid_generate_v4()`),
    labId: uuid("lab_id").notNull(),
    name: text("name"),
    district: text("district"),
    areaHint: text("area_hint"),
    city: text("city").notNull(),
    address: text("address"),
    linkUrl: text("link_url"),
    services: text("services").array(),
    acceptsMail: boolean("accepts_mail"),
    searchText: text("search_text"),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("lab_branch_lab_id_idx").on(table.labId).where(sql`${table.deletedAt} IS NULL`),
    index("lab_branch_city_idx").on(table.city).where(sql`${table.deletedAt} IS NULL`),
    index("lab_branch_search_text_trgm_idx").using("gin", sql`${table.searchText} gin_trgm_ops`),
  ],
);
