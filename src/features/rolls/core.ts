import "server-only";

import { z } from "zod";
import { and, desc, eq, inArray, isNull, or } from "drizzle-orm";
import type { PgQueryResultHKT } from "drizzle-orm/pg-core";
import { bagItem, camera, lens, roll, stock } from "@/db/schema";
import type { TDb } from "@/features/shared/db";
import { isFutureVnDay } from "@/features/rolls/date-utils";
import { formatPushPull, pushPullStops } from "@/features/rolls/push-pull";

/** Same two formats CAT-2's custom stock entries know about (D4). */
const FORMATS = ["35mm", "120"] as const;

export const createRollInputSchema = z
  .object({
    mode: z.enum(["new", "past"]),
    stockId: z.string().uuid(),
    cameraBagItemId: z.string().uuid(),
    lensId: z.string().uuid().optional(),
    name: z.string().trim().min(1).optional(),
    boxIso: z.number().int().positive().optional(),
    shotIso: z.number().int().positive().optional(),
    exposures: z.number().int().positive().optional(),
    format: z.enum(FORMATS).optional(),
    locations: z.array(z.string().trim().min(1)).optional(),
    // Epoch ms, same shape as `formOpenedAt` — the client sends `Date`
    // boundaries as timestamps, not ISO strings, so there's one date
    // representation crossing the Server Action boundary.
    shotFrom: z.number().int().optional(),
    shotTo: z.number().int().optional(),
    // D16: when the form was opened, so the action can derive
    // `duration_ms` for the `roll_created` event.
    formOpenedAt: z.number().int().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.mode !== "past") return;

    if (value.shotFrom === undefined) {
      ctx.addIssue({ code: "custom", path: ["shotFrom"], message: "shotFrom is required in past mode" });
    }
    if (value.shotTo === undefined) {
      ctx.addIssue({ code: "custom", path: ["shotTo"], message: "shotTo is required in past mode" });
    }
    if (value.shotFrom !== undefined && value.shotTo !== undefined && value.shotFrom > value.shotTo) {
      ctx.addIssue({ code: "custom", path: ["shotTo"], message: "shotFrom must be at or before shotTo" });
    }
  });

export type TCreateRollInput = z.infer<typeof createRollInputSchema>;

export type TCreateRollErrorCode =
  | "unauthenticated"
  | "validation"
  | "not_found"
  | "fixed_stock_mismatch";
export type TCreateRollResult =
  | { ok: true; rollId: string }
  | { ok: false; error: TCreateRollErrorCode };

/**
 * D9: `stockId` must be a live stock that's seeded (`owner_id IS NULL`)
 * or the caller's own. There's no foreign key, so this is the only thing
 * standing between a roll and pointing at another user's private stock.
 */
async function findUsableStock<TQueryResult extends PgQueryResultHKT>(
  db: TDb<TQueryResult>,
  stockId: string,
  userId: string,
) {
  const rows = await db
    .select()
    .from(stock)
    .where(
      and(eq(stock.id, stockId), isNull(stock.deletedAt), or(isNull(stock.ownerId), eq(stock.ownerId, userId))),
    )
    .limit(1);

  return rows[0];
}

/** D9: `cameraBagItemId` must be the caller's own live bag item of kind `camera`, resolved to the catalogue `camera` row it points at. */
async function findUsableCamera<TQueryResult extends PgQueryResultHKT>(
  db: TDb<TQueryResult>,
  cameraBagItemId: string,
  userId: string,
) {
  const bagItemRows = await db
    .select()
    .from(bagItem)
    .where(
      and(
        eq(bagItem.id, cameraBagItemId),
        eq(bagItem.userId, userId),
        eq(bagItem.kind, "camera"),
        isNull(bagItem.deletedAt),
      ),
    )
    .limit(1);

  const bagItemRow = bagItemRows[0];
  if (!bagItemRow) return undefined;

  const cameraRows = await db
    .select()
    .from(camera)
    .where(
      and(
        eq(camera.id, bagItemRow.refId),
        isNull(camera.deletedAt),
        or(isNull(camera.ownerId), eq(camera.ownerId, userId)),
      ),
    )
    .limit(1);

  return cameraRows[0];
}

/** D9: `lensId`, if given, must be the caller's own live lens (D3: lenses are never seeded). */
async function findUsableLens<TQueryResult extends PgQueryResultHKT>(
  db: TDb<TQueryResult>,
  lensId: string,
  userId: string,
) {
  const rows = await db
    .select()
    .from(lens)
    .where(and(eq(lens.id, lensId), eq(lens.ownerId, userId), isNull(lens.deletedAt)))
    .limit(1);

  return rows[0];
}

/**
 * ROLL-1/ROLL-2: creates a roll for `userId`. Assumes `input` is already
 * zod-validated (`createRollInputSchema`); the thin `"use server"`
 * wrapper in `actions.ts` is the only caller that parses raw input.
 *
 * `now` defaults to `Date.now()` and is only ever overridden by tests, so
 * D14's "not in the future" rule can be tested deterministically around
 * midnight `Asia/Ho_Chi_Minh`.
 *
 * `import "server-only"` (top of file) keeps this — and its DB imports —
 * out of the client bundle even though `actions.ts` re-exports a thin
 * wrapper around it for client components to call.
 */
export async function createRollCore<TQueryResult extends PgQueryResultHKT>(
  db: TDb<TQueryResult>,
  userId: string,
  input: TCreateRollInput,
  now: number = Date.now(),
): Promise<TCreateRollResult> {
  const stockRow = await findUsableStock(db, input.stockId, userId);
  if (!stockRow) return { ok: false, error: "not_found" };

  const cameraRow = await findUsableCamera(db, input.cameraBagItemId, userId);
  if (!cameraRow) return { ok: false, error: "not_found" };

  if (input.lensId !== undefined) {
    const lensRow = await findUsableLens(db, input.lensId, userId);
    if (!lensRow) return { ok: false, error: "not_found" };
  }

  // D20: a single-use camera's film is fixed. The roll's stock is forced
  // to it — a caller-supplied `stockId` that isn't that fixed stock is a
  // logic error, not something to silently override.
  let finalStockRow = stockRow;
  if (cameraRow.fixedStockId !== null) {
    if (cameraRow.fixedStockId !== stockRow.id) {
      return { ok: false, error: "fixed_stock_mismatch" };
    }
    finalStockRow = stockRow;
  }

  let shotFrom: Date;
  let shotTo: Date | null;

  if (input.mode === "past") {
    if (input.shotFrom === undefined || input.shotTo === undefined) {
      return { ok: false, error: "validation" };
    }
    if (input.shotFrom > input.shotTo) {
      return { ok: false, error: "validation" };
    }
    if (isFutureVnDay(input.shotFrom, now) || isFutureVnDay(input.shotTo, now)) {
      return { ok: false, error: "validation" };
    }
    shotFrom = new Date(input.shotFrom);
    shotTo = new Date(input.shotTo);
  } else {
    shotFrom = input.shotFrom !== undefined ? new Date(input.shotFrom) : new Date(now);
    shotTo = input.shotTo !== undefined ? new Date(input.shotTo) : null;
  }

  return db.transaction(async (tx) => {
    const existingBagItem = await tx
      .select({ id: bagItem.id })
      .from(bagItem)
      .where(
        and(
          eq(bagItem.userId, userId),
          eq(bagItem.kind, "stock"),
          eq(bagItem.refId, finalStockRow.id),
          isNull(bagItem.deletedAt),
        ),
      )
      .limit(1);

    if (!existingBagItem[0]) {
      await tx.insert(bagItem).values({ userId, kind: "stock", refId: finalStockRow.id });
    }

    const [rollRow] = await tx
      .insert(roll)
      .values({
        userId,
        stockId: finalStockRow.id,
        cameraBagItemId: input.cameraBagItemId,
        lensId: input.lensId ?? null,
        name: input.name ?? null,
        canisterColor: finalStockRow.canisterColor ?? null,
        boxIso: input.boxIso ?? finalStockRow.iso ?? null,
        shotIso: input.shotIso ?? null,
        exposures: input.exposures ?? null,
        format: input.format ?? null,
        locations: input.locations ?? null,
        shotFrom,
        shotTo,
        version: 1,
      })
      .returning();

    return { ok: true, rollId: rollRow.id };
  });
}

export interface IRollStockSummary {
  id: string;
  brand: string;
  name: string;
  iso: number | null;
  canisterColor: string | null;
  /** Natural-key slug (`stock.type`, e.g. `"color-negative"`) — the caller maps it through `stockTypeLabelKey` before showing it (never the raw slug). */
  type: string | null;
}

export interface IRollCameraSummary {
  brand: string;
  model: string;
  /** Natural-key slug (`camera.type`, e.g. `"slr"`) — the caller maps it through `cameraTypeLabelKey` before showing it (never the raw slug). */
  type: string | null;
}

export interface IRollLensSummary {
  brand: string;
  model: string | null;
  focalLength: string | null;
}

export interface IRollEntry {
  id: string;
  name: string | null;
  canisterColor: string | null;
  boxIso: number | null;
  shotIso: number | null;
  exposures: number | null;
  format: string | null;
  locations: string[] | null;
  shotFrom: Date | null;
  shotTo: Date | null;
  notes: string | null;
  memory: string | null;
  version: number;
  createdAt: Date;
  /** ROLL-1, D17: `formatPushPull(pushPullStops(boxIso, shotIso))`, or `null` when either ISO is missing. */
  pushPull: string | null;
  stock: IRollStockSummary | null;
  camera: IRollCameraSummary | null;
  lens: IRollLensSummary | null;
}

type TRollRow = typeof roll.$inferSelect;

/**
 * Joins `rollRows` (already owner-scoped and excluding soft-deleted rows)
 * to their stock, camera (via the roll's `camera_bag_item_id`) and lens —
 * there's no foreign key (D9), so this is a batch `inArray` fetch per
 * table standing in for a join, same shape as `bag/queries.ts#listBag`.
 */
async function hydrateRolls<TQueryResult extends PgQueryResultHKT>(
  db: TDb<TQueryResult>,
  rollRows: TRollRow[],
): Promise<IRollEntry[]> {
  const stockIds = Array.from(new Set(rollRows.map((row) => row.stockId)));
  const cameraBagItemIds = Array.from(new Set(rollRows.map((row) => row.cameraBagItemId)));
  const lensIds = Array.from(
    new Set(rollRows.map((row) => row.lensId).filter((id): id is string => id !== null)),
  );

  const stockRows =
    stockIds.length === 0 ? [] : await db.select().from(stock).where(inArray(stock.id, stockIds));

  const cameraBagItemRows =
    cameraBagItemIds.length === 0
      ? []
      : await db.select().from(bagItem).where(inArray(bagItem.id, cameraBagItemIds));

  const cameraIds = Array.from(new Set(cameraBagItemRows.map((row) => row.refId)));
  const cameraRows =
    cameraIds.length === 0 ? [] : await db.select().from(camera).where(inArray(camera.id, cameraIds));

  const lensRows = lensIds.length === 0 ? [] : await db.select().from(lens).where(inArray(lens.id, lensIds));

  const stockById = new Map(stockRows.map((row) => [row.id, row]));
  const cameraBagItemById = new Map(cameraBagItemRows.map((row) => [row.id, row]));
  const cameraById = new Map(cameraRows.map((row) => [row.id, row]));
  const lensById = new Map(lensRows.map((row) => [row.id, row]));

  return rollRows.map((row) => {
    const stockRow = stockById.get(row.stockId);
    const cameraBagItemRow = cameraBagItemById.get(row.cameraBagItemId);
    const cameraRow = cameraBagItemRow ? cameraById.get(cameraBagItemRow.refId) : undefined;
    const lensRow = row.lensId ? lensById.get(row.lensId) : undefined;

    return {
      id: row.id,
      name: row.name,
      canisterColor: row.canisterColor,
      boxIso: row.boxIso,
      shotIso: row.shotIso,
      exposures: row.exposures,
      format: row.format,
      locations: row.locations,
      shotFrom: row.shotFrom,
      shotTo: row.shotTo,
      notes: row.notes,
      memory: row.memory,
      version: row.version,
      createdAt: row.createdAt,
      pushPull: formatPushPull(pushPullStops(row.boxIso, row.shotIso)),
      stock: stockRow
        ? {
            id: stockRow.id,
            brand: stockRow.brand,
            name: stockRow.name,
            iso: stockRow.iso,
            canisterColor: stockRow.canisterColor,
            type: stockRow.type,
          }
        : null,
      camera: cameraRow ? { brand: cameraRow.brand, model: cameraRow.model, type: cameraRow.type } : null,
      lens: lensRow ? { brand: lensRow.brand, model: lensRow.model, focalLength: lensRow.focalLength } : null,
    };
  });
}

/** D15: `userId`'s live rolls, newest first, each joined to its stock, camera and lens, with a computed push/pull badge. */
export async function listRollsCore<TQueryResult extends PgQueryResultHKT>(
  db: TDb<TQueryResult>,
  userId: string,
): Promise<IRollEntry[]> {
  const rollRows = await db
    .select()
    .from(roll)
    .where(and(eq(roll.userId, userId), isNull(roll.deletedAt)))
    .orderBy(desc(roll.createdAt));

  return hydrateRolls(db, rollRows);
}

/** D15: a single roll page's data — `null` when `rollId` doesn't exist, isn't `userId`'s own, or is soft-deleted. */
export async function getRollCore<TQueryResult extends PgQueryResultHKT>(
  db: TDb<TQueryResult>,
  userId: string,
  rollId: string,
): Promise<IRollEntry | null> {
  const rollRows = await db
    .select()
    .from(roll)
    .where(and(eq(roll.id, rollId), eq(roll.userId, userId), isNull(roll.deletedAt)))
    .limit(1);

  const rollRow = rollRows[0];
  if (!rollRow) return null;

  const [entry] = await hydrateRolls(db, [rollRow]);
  return entry;
}
