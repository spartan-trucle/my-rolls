import { sql } from "drizzle-orm";
import { boolean, index, integer, jsonb, pgTable, smallint, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

/**
 * Phase 2 plan D7 (LAB-3): one scan set per roll in the MVP. `lab_id` and a nullable
 * `lab_branch_id` because Phase 1's `LabPicker` returns `{ labId, branchId | null }` and
 * "Tự tráng ở nhà" has no branch. Both stay null until the user picks, because the upload
 * starts first ("upload first, lab second" on the boards). Every detail after the lab is
 * optional; Compare needs scanner and process later, so they're stored from day one.
 *
 * House rules (Phase 1 D9): `uuid_generate_v4()` ids, no foreign keys (`roll_id`, `lab_id`,
 * `lab_branch_id` are bare ids the core owner-checks), soft deletes, partial indexes.
 */
export const SCAN_PROCESSES = ["c41", "e6", "bw", "ecn2"] as const;
export type TScanProcess = (typeof SCAN_PROCESSES)[number];

export const scanSet = pgTable(
  "scan_set",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`uuid_generate_v4()`),
    userId: text("user_id").notNull(),
    rollId: uuid("roll_id").notNull(),
    labId: uuid("lab_id"),
    labBranchId: uuid("lab_branch_id"),
    receivedAt: timestamp("received_at", { withTimezone: true }),
    droppedAt: timestamp("dropped_at", { withTimezone: true }),
    process: text("process", { enum: SCAN_PROCESSES }),
    /** D8: thirds of a stop, +3 = +1 stop, prefilled from the roll's computed push/pull. */
    pushPullThirds: smallint("push_pull_thirds"),
    scanner: text("scanner"),
    /** Long edge in pixels. */
    resolutionPx: integer("resolution_px"),
    fileFormat: text("file_format"),
    priceVnd: integer("price_vnd"),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // D7: one live scan set per roll, dropped when LAB-4 (rescans) ships.
    uniqueIndex("scan_set_roll_id_idx").on(table.rollId).where(sql`${table.deletedAt} IS NULL`),
    index("scan_set_user_id_idx").on(table.userId).where(sql`${table.deletedAt} IS NULL`),
  ],
);

/** D2: a frame is `pending` from the moment its upload slot is signed until confirm checks R2. */
export const FRAME_STATUSES = ["pending", "ready"] as const;
export type TFrameStatus = (typeof FRAME_STATUSES)[number];

/**
 * Phase 2 plan D2, D3 (SCAN-1–4). `user_id` and `roll_id` are copied on so the roll page and
 * the library view need no join. Marks are two booleans (D3); oops comes from `mistake` (D5);
 * notes live in `note` (D6), so there's no `mark` or `note` column. Keys follow D10:
 * `originals/<userId>/<frameId>.<ext>` (private), `grid/<uuid>` and `view/<uuid>` (public).
 */
export const frame = pgTable(
  "frame",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`uuid_generate_v4()`),
    userId: text("user_id").notNull(),
    rollId: uuid("roll_id").notNull(),
    scanSetId: uuid("scan_set_id").notNull(),
    position: integer("position").notNull(),
    fileName: text("file_name").notNull(),
    contentType: text("content_type").notNull(),
    bytes: integer("bytes").notNull(),
    /** D13: hex SHA-256 of the original, for SCAN-5's duplicate skip later. */
    sha256: text("sha256"),
    width: integer("width"),
    height: integer("height"),
    /** D12: EXIF with every GPS tag removed in the browser. */
    exif: jsonb("exif").$type<Record<string, unknown>>(),
    originalKey: text("original_key").notNull(),
    gridKey: text("grid_key").notNull(),
    viewKey: text("view_key").notNull(),
    isKeeper: boolean("is_keeper").notNull().default(false),
    isBlank: boolean("is_blank").notNull().default(false),
    altText: text("alt_text"),
    status: text("status", { enum: FRAME_STATUSES }).notNull().default("pending"),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("frame_roll_id_position_idx").on(table.rollId, table.position).where(sql`${table.deletedAt} IS NULL`),
    // Phase 3's library-wide tấm ưng view (COL-3) without a join.
    index("frame_user_id_is_keeper_created_at_idx")
      .on(table.userId, table.isKeeper, table.createdAt)
      .where(sql`${table.deletedAt} IS NULL AND ${table.status} = 'ready'`),
    // D17: the nightly cleanup scans pending frames by age.
    index("frame_pending_created_at_idx")
      .on(table.createdAt)
      .where(sql`${table.deletedAt} IS NULL AND ${table.status} = 'pending'`),
  ],
);
