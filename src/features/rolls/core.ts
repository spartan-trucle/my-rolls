import "server-only";

import { z } from "zod";
import { and, desc, eq, inArray, isNull, or } from "drizzle-orm";
import type { PgQueryResultHKT } from "drizzle-orm/pg-core";
import { bagItem, camera, lens, roll, stock } from "@/db/schema";
import type { TDb } from "@/features/shared/db";
import { isFutureVnDay, isFutureVnMonth, vnMonthEnd, vnMonthStart } from "@/features/rolls/date-utils";
import { formatPushPull, pushPullStops } from "@/features/rolls/push-pull";

/** Same two formats CAT-2's custom stock entries know about (D4). */
const FORMATS = ["35mm", "120"] as const;

/** R2-4: a past-mode "Chụp khoảng khi nào" month + year pick. `month` is 1–12. */
const monthYearSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int(),
});

export type TMonthYear = z.infer<typeof monthYearSchema>;

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
    // representation crossing the Server Action boundary. Always how a
    // "new"-mode roll's dates are sent (day precision); also how a
    // "past"-mode roll can still be sent exact-day (backward compatible
    // with the day-picker form that predates R2-4).
    shotFrom: z.number().int().optional(),
    shotTo: z.number().int().optional(),
    // R2-4: past mode's month-precision alternative to shotFrom/shotTo
    // above. `null` means "Không nhớ" for that side; omitting the key
    // entirely is the same as `null` (see `resolvePastDates`). Presence
    // of either key (even as `null`) switches `createRollCore` onto the
    // month-precision path instead of requiring shotFrom/shotTo.
    shotFromMonth: monthYearSchema.nullable().optional(),
    shotToMonth: monthYearSchema.nullable().optional(),
    // D16: when the form was opened, so the action can derive
    // `duration_ms` for the `roll_created` event.
    formOpenedAt: z.number().int().optional(),
    // Round 2 audit N4: "Thêm {film} vào túi cho lần sau" — whether a
    // stock picked from the inline catalogue search (not already in the
    // bag) should be kept there after this roll. Defaults to `true`
    // (omitted) so every caller that predates N4 keeps today's behaviour
    // of always bagging a new stock.
    addStockToBag: z.boolean().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.mode !== "past") return;

    const hasExact = value.shotFrom !== undefined && value.shotTo !== undefined;
    const hasMonth = value.shotFromMonth !== undefined || value.shotToMonth !== undefined;

    if (!hasExact && !hasMonth) {
      ctx.addIssue({
        code: "custom",
        path: ["shotFrom"],
        message: "shotFrom/shotTo or shotFromMonth/shotToMonth is required in past mode",
      });
      return;
    }

    if (hasExact && !hasMonth && value.shotFrom! > value.shotTo!) {
      ctx.addIssue({ code: "custom", path: ["shotTo"], message: "shotFrom must be at or before shotTo" });
    }
  });

export type TCreateRollInput = z.infer<typeof createRollInputSchema>;

type TStockSelectRow = typeof stock.$inferSelect;

type TResolvedDates =
  | { ok: true; shotFrom: Date | null; shotTo: Date | null; datePrecision: "day" | "month" | null }
  | { ok: false };

/**
 * R2-4: resolves `input`'s dates to a `shotFrom`/`shotTo`/`datePrecision`
 * triple, for both roll modes. "new" mode is always day precision
 * (defaulting `shotFrom` to `now` when omitted, same as before R2-4).
 * "past" mode picks month precision the moment either `shotFromMonth` or
 * `shotToMonth` was sent at all (even as `null`, "Không nhớ" — see the
 * schema comment above); otherwise it falls back to the exact-day
 * `shotFrom`/`shotTo` path, unchanged since before R2-4 for backward
 * compatibility with any caller still sending exact past-mode dates.
 */
function resolveDates(input: TCreateRollInput, now: number): TResolvedDates {
  if (input.mode === "new") {
    const shotFrom = input.shotFrom !== undefined ? new Date(input.shotFrom) : new Date(now);
    const shotTo = input.shotTo !== undefined ? new Date(input.shotTo) : null;
    return { ok: true, shotFrom, shotTo, datePrecision: "day" };
  }

  const usesMonthPrecision = input.shotFromMonth !== undefined || input.shotToMonth !== undefined;

  if (usesMonthPrecision) {
    const fromMonthYear = input.shotFromMonth ?? null;
    const toMonthYear = input.shotToMonth ?? null;

    if (fromMonthYear && isFutureVnMonth(fromMonthYear.month, fromMonthYear.year, now)) return { ok: false };
    if (toMonthYear && isFutureVnMonth(toMonthYear.month, toMonthYear.year, now)) return { ok: false };
    if (fromMonthYear && toMonthYear) {
      const fromKey = fromMonthYear.year * 12 + fromMonthYear.month;
      const toKey = toMonthYear.year * 12 + toMonthYear.month;
      if (fromKey > toKey) return { ok: false };
    }

    return {
      ok: true,
      shotFrom: fromMonthYear ? vnMonthStart(fromMonthYear.month, fromMonthYear.year) : null,
      shotTo: toMonthYear ? vnMonthEnd(toMonthYear.month, toMonthYear.year) : null,
      datePrecision: fromMonthYear || toMonthYear ? "month" : null,
    };
  }

  if (input.shotFrom === undefined || input.shotTo === undefined) return { ok: false };
  if (input.shotFrom > input.shotTo) return { ok: false };
  if (isFutureVnDay(input.shotFrom, now) || isFutureVnDay(input.shotTo, now)) return { ok: false };

  return { ok: true, shotFrom: new Date(input.shotFrom), shotTo: new Date(input.shotTo), datePrecision: "day" };
}

export type TCreateRollErrorCode =
  | "unauthenticated"
  | "validation"
  | "not_found"
  | "fixed_stock_mismatch";
export type TCreateRollResult =
  | {
      ok: true;
      rollId: string;
      /** R2-5: the roll's "Cuộn #N" (`RollSaved`'s kicker). */
      number: number;
      /**
       * BAG-2 (R2-3): the stock bag item's `qty` after this roll took one
       * out, so the form can show "túi còn N" — `null` when the stock
       * wasn't being counted (its bag item had `qty` 0 or `null`) or
       * wasn't in the bag at all yet.
       */
      remainingQty: number | null;
    }
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

  const resolvedDates = resolveDates(input, now);
  if (!resolvedDates.ok) return { ok: false, error: "validation" };
  const { shotFrom, shotTo, datePrecision } = resolvedDates;

  // R2-5: retried once on a `roll_user_id_number_idx` unique violation —
  // two concurrent creates for the same user can both read the same
  // `MAX(number)` before either commits (the `FOR UPDATE` lock inside the
  // transaction only protects against that once a first roll already
  // exists to lock). A non-uniqueness failure (a bug, a constraint the
  // test suite fakes) is never retried, and rethrows past this function,
  // same as before R2-5.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return await attemptCreateRoll(db, userId, input, finalStockRow, { shotFrom, shotTo, datePrecision });
    } catch (error) {
      if (attempt === 0 && isUniqueViolation(error)) continue;
      throw error;
    }
  }

  // Unreachable — the loop above always returns or throws — but keeps
  // the function's return type total for TypeScript.
  throw new Error("createRollCore: unreachable");
}

/**
 * Postgres's `unique_violation` SQLSTATE (`23505`). `pg` and PGlite put it
 * straight on the thrown error's `.code`; drizzle-orm's own
 * `DrizzleQueryError` wraps that as `.cause` instead, so both are
 * checked.
 */
function isUniqueViolation(error: unknown): boolean {
  const code = (error as { code?: unknown } | undefined)?.code;
  if (code === "23505") return true;

  const cause = (error as { cause?: unknown } | undefined)?.cause;
  return (cause as { code?: unknown } | undefined)?.code === "23505";
}

async function attemptCreateRoll<TQueryResult extends PgQueryResultHKT>(
  db: TDb<TQueryResult>,
  userId: string,
  input: TCreateRollInput,
  finalStockRow: TStockSelectRow,
  dates: { shotFrom: Date | null; shotTo: Date | null; datePrecision: "day" | "month" | null },
): Promise<TCreateRollResult> {
  return db.transaction(async (tx) => {
    const existingBagItem = await tx
      .select({ id: bagItem.id, qty: bagItem.qty })
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

    // BAG-2 (R2-3): loading a roll takes one out. Only when the stock is
    // already in the bag and being counted (`qty` a positive number) —
    // a brand-new bag item (added right here) has no count yet, and
    // `qty` 0/`null` means "not counted", left alone rather than going
    // negative or being silently turned into a count.
    let remainingQty: number | null = null;
    if (!existingBagItem[0]) {
      // N4: a caller can opt out (the "Thêm ... vào túi cho lần sau"
      // checkbox, unchecked) of leaving a freshly-picked stock in the bag.
      // Omitted/`true` keeps the pre-N4 behaviour of always bagging it.
      if (input.addStockToBag !== false) {
        await tx.insert(bagItem).values({ userId, kind: "stock", refId: finalStockRow.id });
      }
    } else if (existingBagItem[0].qty !== null && existingBagItem[0].qty > 0) {
      remainingQty = existingBagItem[0].qty - 1;
      await tx.update(bagItem).set({ qty: remainingQty }).where(eq(bagItem.id, existingBagItem[0].id));
    }

    // R2-5: the next per-user roll number, over every row (live or soft-
    // deleted, D9) so a number is never reused. `FOR UPDATE` locks the
    // highest-numbered row so a second concurrent transaction for the
    // same user blocks here until this one commits or rolls back.
    const latestNumberRows = await tx
      .select({ number: roll.number })
      .from(roll)
      .where(eq(roll.userId, userId))
      .orderBy(desc(roll.number))
      .limit(1)
      .for("update");
    const nextNumber = (latestNumberRows[0]?.number ?? 0) + 1;

    const [rollRow] = await tx
      .insert(roll)
      .values({
        userId,
        stockId: finalStockRow.id,
        cameraBagItemId: input.cameraBagItemId,
        lensId: input.lensId ?? null,
        number: nextNumber,
        name: input.name ?? null,
        canisterColor: finalStockRow.canisterColor ?? null,
        boxIso: input.boxIso ?? finalStockRow.iso ?? null,
        shotIso: input.shotIso ?? null,
        exposures: input.exposures ?? null,
        format: input.format ?? null,
        locations: input.locations ?? null,
        shotFrom: dates.shotFrom,
        shotTo: dates.shotTo,
        datePrecision: dates.datePrecision,
        version: 1,
      })
      .returning();

    return { ok: true, rollId: rollRow.id, number: nextNumber, remainingQty };
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
  /**
   * R2-5: the per-user "Cuộn #N" — `null` only for a pre-migration row
   * that somehow missed the backfill. Optional in the type (not just
   * nullable) only so pre-Round-2 `IRollEntry` fixtures elsewhere
   * (`roll-card-mapper.test.ts` and friends) keep type-checking without
   * every one of them being touched; `hydrateRolls` always sets it.
   */
  number?: number | null;
  name: string | null;
  canisterColor: string | null;
  boxIso: number | null;
  shotIso: number | null;
  exposures: number | null;
  format: string | null;
  locations: string[] | null;
  shotFrom: Date | null;
  shotTo: Date | null;
  /**
   * R2-4: whether shotFrom/shotTo are exact (`"day"`), a picked month
   * (`"month"`), or unknown/absent (`null`, "Không nhớ") —
   * `formatRollDate`'s second argument. Optional for the same reason as
   * `number` above.
   */
  datePrecision?: "day" | "month" | null;
  notes: string | null;
  memory: string | null;
  version: number;
  createdAt: Date;
  /** ROLL-1, D17: `formatPushPull(pushPullStops(boxIso, shotIso))`, or `null` when either ISO is missing. */
  pushPull: string | null;
  stock: IRollStockSummary | null;
  camera: IRollCameraSummary | null;
  lens: IRollLensSummary | null;
  /**
   * R4: raw referenced ids, so `RollForm`'s edit mode can preselect the
   * same bag entries `attemptCreateRoll` stored — `IRollStockSummary` /
   * `IRollCameraSummary` / `IRollLensSummary` above are display-only and
   * don't carry these. Optional for the same "old fixture" reason as
   * `number` above.
   */
  stockId?: string;
  cameraBagItemId?: string;
  lensId?: string | null;
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
      number: row.number,
      stockId: row.stockId,
      cameraBagItemId: row.cameraBagItemId,
      lensId: row.lensId,
      name: row.name,
      canisterColor: row.canisterColor,
      boxIso: row.boxIso,
      shotIso: row.shotIso,
      exposures: row.exposures,
      format: row.format,
      locations: row.locations,
      shotFrom: row.shotFrom,
      shotTo: row.shotTo,
      datePrecision: row.datePrecision,
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

/**
 * N1: a read-only peek at the "Cuộn #N" `createRollCore` would assign if
 * `userId` saved a roll right now — the form's header kicker and the
 * "Để trống thì gọi là Cuộn #N" name hint. Not locked (no `FOR UPDATE`,
 * unlike the real insert): it's a hint only, and can drift by one if
 * another roll is saved in between, same trade-off the audit's "Decisions
 * for the owner" table calls out for computed roll numbers.
 */
export async function peekNextRollNumberCore<TQueryResult extends PgQueryResultHKT>(
  db: TDb<TQueryResult>,
  userId: string,
): Promise<number> {
  const rows = await db
    .select({ number: roll.number })
    .from(roll)
    .where(eq(roll.userId, userId))
    .orderBy(desc(roll.number))
    .limit(1);

  return (rows[0]?.number ?? 0) + 1;
}

/**
 * R4: fields an owner can change on an already-saved roll — everything
 * `createRollInputSchema` accepts except `mode` (a roll doesn't switch
 * between new/past after the fact) and the create-only knobs
 * (`addStockToBag`, `formOpenedAt`). `expectedVersion` guards against a
 * stale edit clobbering a newer one (optimistic concurrency over
 * `roll.version`, D9's no-FK world already leaning on this pattern).
 */
export const updateRollInputSchema = z
  .object({
    rollId: z.string().uuid(),
    expectedVersion: z.number().int().positive(),
    stockId: z.string().uuid(),
    cameraBagItemId: z.string().uuid(),
    lensId: z.string().uuid().optional(),
    name: z.string().trim().min(1).optional(),
    boxIso: z.number().int().positive().optional(),
    shotIso: z.number().int().positive().optional(),
    exposures: z.number().int().positive().optional(),
    format: z.enum(FORMATS).optional(),
    locations: z.array(z.string().trim().min(1)).optional(),
    shotFrom: z.number().int().optional(),
    shotTo: z.number().int().optional(),
    shotFromMonth: monthYearSchema.nullable().optional(),
    shotToMonth: monthYearSchema.nullable().optional(),
  })
  .superRefine((value, ctx) => {
    const hasExact = value.shotFrom !== undefined && value.shotTo !== undefined;
    if (hasExact && !value.shotFromMonth && !value.shotToMonth && value.shotFrom! > value.shotTo!) {
      ctx.addIssue({ code: "custom", path: ["shotTo"], message: "shotFrom must be at or before shotTo" });
    }
  });

export type TUpdateRollInput = z.infer<typeof updateRollInputSchema>;

export type TUpdateRollErrorCode =
  | "unauthenticated"
  | "validation"
  | "not_found"
  | "stale_version"
  | "fixed_stock_mismatch";
export type TUpdateRollResult = { ok: true } | { ok: false; error: TUpdateRollErrorCode };

/**
 * R4: updates `rollId` in place — owner-checked (D9) both on the roll row
 * itself and on every referenced stock/camera/lens (same helpers
 * `createRollCore` uses), and bumps `version`. Dates go through the same
 * month/day resolution as create (R2-4), but always in "past"-mode shape
 * since an edit never has a "no dates yet, loaded now" state to fall back
 * to — a roll with no dates at all simply keeps `shotFrom`/`shotTo` `null`
 * (`resolveDates` only requires *something* when `mode` is `"past"`).
 */
export async function updateRollCore<TQueryResult extends PgQueryResultHKT>(
  db: TDb<TQueryResult>,
  userId: string,
  input: TUpdateRollInput,
  now: number = Date.now(),
): Promise<TUpdateRollResult> {
  const stockRow = await findUsableStock(db, input.stockId, userId);
  if (!stockRow) return { ok: false, error: "not_found" };

  const cameraRow = await findUsableCamera(db, input.cameraBagItemId, userId);
  if (!cameraRow) return { ok: false, error: "not_found" };

  if (input.lensId !== undefined) {
    const lensRow = await findUsableLens(db, input.lensId, userId);
    if (!lensRow) return { ok: false, error: "not_found" };
  }

  let finalStockRow = stockRow;
  if (cameraRow.fixedStockId !== null) {
    if (cameraRow.fixedStockId !== stockRow.id) {
      return { ok: false, error: "fixed_stock_mismatch" };
    }
    finalStockRow = stockRow;
  }

  const hasMonthKeys = input.shotFromMonth !== undefined || input.shotToMonth !== undefined;
  const resolvedDates = resolveDates(
    { ...input, mode: hasMonthKeys || input.shotFrom !== undefined ? "past" : "new" } as TCreateRollInput,
    now,
  );
  // An edit with no dates at all (never had any, still doesn't) is valid —
  // `resolveDates` only rejects "past" mode when nothing was sent, which a
  // synthetic `mode: "new"` never triggers when both date keys are absent.
  const dates =
    resolvedDates.ok
      ? resolvedDates
      : { shotFrom: null, shotTo: null, datePrecision: null as "day" | "month" | null };
  if (!resolvedDates.ok && (hasMonthKeys || input.shotFrom !== undefined)) {
    return { ok: false, error: "validation" };
  }

  const existingRows = await db
    .select({ id: roll.id, version: roll.version })
    .from(roll)
    .where(and(eq(roll.id, input.rollId), eq(roll.userId, userId), isNull(roll.deletedAt)))
    .limit(1);
  const existing = existingRows[0];
  if (!existing) return { ok: false, error: "not_found" };
  if (existing.version !== input.expectedVersion) return { ok: false, error: "stale_version" };

  const result = await db
    .update(roll)
    .set({
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
      shotFrom: dates.shotFrom,
      shotTo: dates.shotTo,
      datePrecision: dates.datePrecision,
      version: existing.version + 1,
    })
    .where(and(eq(roll.id, input.rollId), eq(roll.userId, userId), eq(roll.version, input.expectedVersion)));

  // `rowCount` (drizzle-orm / pg / PGlite all expose it): a concurrent
  // edit could have bumped the version between the read above and this
  // write, in which case the `eq(roll.version, ...)` guard matches zero
  // rows rather than the SELECT's own stale read.
  if ((result as { rowCount?: number }).rowCount === 0) {
    return { ok: false, error: "stale_version" };
  }

  return { ok: true };
}
