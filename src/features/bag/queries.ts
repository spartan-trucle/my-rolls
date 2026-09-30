import { and, count, desc, eq, inArray, isNull, or } from "drizzle-orm";
import type { PgQueryResultHKT } from "drizzle-orm/pg-core";
import { bagItem, camera, lens, roll, stock, user } from "@/db/schema";
import type { TDb } from "@/features/shared/db";

export type TStockRow = typeof stock.$inferSelect;
export type TCameraRow = typeof camera.$inferSelect;
export type TLensRow = typeof lens.$inferSelect;

/**
 * Round 2 (BAG-3, audit B4/B3/B5): rolls shot on this bag item, always
 * present (never `undefined`) but optional in the type only so the
 * pre-Round-2 fixtures in `RollForm.test.tsx`/`BagList.test.tsx` — which
 * build a `TBagEntry` literal by hand and never set it — keep type-
 * checking. Real callers (`listBag`) always fill it in.
 */
export type TBagEntry =
  | {
      bagItemId: string;
      kind: "stock";
      createdAt: Date;
      stock: TStockRow;
      // BAG-2 (Round 2): `null` means "not counted", not zero.
      qty?: number | null;
      expiryYear?: number | null;
      rollsShot?: number;
    }
  | {
      bagItemId: string;
      kind: "camera";
      createdAt: Date;
      camera: TCameraRow;
      // D20: a single-use camera's fixed film, resolved for display —
      // `null` for every other camera.
      fixedStock: TStockRow | null;
      rollsShot?: number;
    }
  | { bagItemId: string; kind: "lens"; createdAt: Date; lens: TLensRow; rollsShot?: number };

/**
 * A row that references a private entry the caller doesn't own, or a
 * soft-deleted one. Shouldn't happen — `addToBag` (B4) checks ownership
 * before inserting — but `bag_item` has no foreign key (D9), so this is
 * the read side's own guard: such a row is silently dropped rather than
 * shown with missing data or another user's private entry.
 */
function ownedAndLive<T extends { ownerId: string | null; deletedAt: Date | null }>(
  row: T | undefined,
  userId: string,
): row is T {
  return row !== undefined && row.deletedAt === null && (row.ownerId === null || row.ownerId === userId);
}

/**
 * BAG-1: `userId`'s live bag items, newest first, each joined to its
 * `stock` / `camera` / `lens` row by branching on `kind` — there's no
 * foreign key (D9), so a single `inArray` fetch per kind stands in for a
 * join. A single-use camera's fixed stock (D20) is resolved and attached
 * so the bag list can show its film without a second round trip from the
 * caller.
 *
 * Round 2: also attaches `qty`/`expiryYear` straight off the `bag_item`
 * row for stock entries (BAG-2), and `rollsShot` — the caller's own live
 * rolls pointing at this bag item's `camera_bag_item_id` (camera),
 * `stock_id` (stock) or `lens_id` (lens) — for every kind (BAG-3, audit
 * B4/B3/B5). One extra query over `roll`, grouped in JS rather than SQL
 * since there's no foreign key to join on (D9) and a bag is small.
 */
export async function listBag<TQueryResult extends PgQueryResultHKT>(
  db: TDb<TQueryResult>,
  userId: string,
): Promise<TBagEntry[]> {
  const items = await db
    .select()
    .from(bagItem)
    .where(and(eq(bagItem.userId, userId), isNull(bagItem.deletedAt)))
    .orderBy(desc(bagItem.createdAt));

  const stockIds = items.filter((item) => item.kind === "stock").map((item) => item.refId);
  const cameraIds = items.filter((item) => item.kind === "camera").map((item) => item.refId);
  const lensIds = items.filter((item) => item.kind === "lens").map((item) => item.refId);

  const cameraRows =
    cameraIds.length === 0
      ? []
      : await db
          .select()
          .from(camera)
          .where(and(inArray(camera.id, cameraIds), or(isNull(camera.ownerId), eq(camera.ownerId, userId))));

  const fixedStockIds = cameraRows
    .map((row) => row.fixedStockId)
    .filter((id): id is string => id !== null);

  const allStockIds = Array.from(new Set([...stockIds, ...fixedStockIds]));

  const stockRows =
    allStockIds.length === 0
      ? []
      : await db
          .select()
          .from(stock)
          .where(and(inArray(stock.id, allStockIds), or(isNull(stock.ownerId), eq(stock.ownerId, userId))));

  const lensRows =
    lensIds.length === 0
      ? []
      : await db.select().from(lens).where(and(inArray(lens.id, lensIds), eq(lens.ownerId, userId)));

  const rollRows = await db
    .select({ stockId: roll.stockId, cameraBagItemId: roll.cameraBagItemId, lensId: roll.lensId })
    .from(roll)
    .where(and(eq(roll.userId, userId), isNull(roll.deletedAt)));

  const rollsShotByStockId = new Map<string, number>();
  const rollsShotByCameraBagItemId = new Map<string, number>();
  const rollsShotByLensId = new Map<string, number>();
  for (const row of rollRows) {
    rollsShotByStockId.set(row.stockId, (rollsShotByStockId.get(row.stockId) ?? 0) + 1);
    rollsShotByCameraBagItemId.set(row.cameraBagItemId, (rollsShotByCameraBagItemId.get(row.cameraBagItemId) ?? 0) + 1);
    if (row.lensId) rollsShotByLensId.set(row.lensId, (rollsShotByLensId.get(row.lensId) ?? 0) + 1);
  }

  const stockById = new Map(stockRows.map((row) => [row.id, row]));
  const cameraById = new Map(cameraRows.map((row) => [row.id, row]));
  const lensById = new Map(lensRows.map((row) => [row.id, row]));

  const entries: TBagEntry[] = [];

  for (const item of items) {
    if (item.kind === "stock") {
      const stockRow = stockById.get(item.refId);
      if (ownedAndLive(stockRow, userId)) {
        entries.push({
          bagItemId: item.id,
          kind: "stock",
          createdAt: item.createdAt,
          stock: stockRow,
          qty: item.qty,
          expiryYear: item.expiryYear,
          rollsShot: rollsShotByStockId.get(item.refId) ?? 0,
        });
      }
    } else if (item.kind === "camera") {
      const cameraRow = cameraById.get(item.refId);
      if (ownedAndLive(cameraRow, userId)) {
        const fixedStock = cameraRow.fixedStockId ? (stockById.get(cameraRow.fixedStockId) ?? null) : null;
        entries.push({
          bagItemId: item.id,
          kind: "camera",
          createdAt: item.createdAt,
          camera: cameraRow,
          fixedStock,
          rollsShot: rollsShotByCameraBagItemId.get(item.id) ?? 0,
        });
      }
    } else {
      const lensRow = lensById.get(item.refId);
      if (lensRow !== undefined && lensRow.deletedAt === null && lensRow.ownerId === userId) {
        entries.push({
          bagItemId: item.id,
          kind: "lens",
          createdAt: item.createdAt,
          lens: lensRow,
          rollsShot: rollsShotByLensId.get(item.refId) ?? 0,
        });
      }
    }
  }

  return entries;
}

export interface IBagCanisterSummary {
  stockId: string;
  canisterColor: string | null;
  iso: number | null;
  qty: number;
}

export interface IBagSummary {
  /** BAG-2's "N cuộn chưa chụp": the sum of `qty` over every stock entry that's being counted (`qty` not `null`). */
  unloadedRolls: number;
  /** B7's "N loại film": the number of distinct film stocks in the bag, counted or not. */
  filmTypeCount: number;
  cameraCount: number;
  lensCount: number;
  /** The bag's canister strip (audit B1): one entry per stock that's being counted and has at least one left, newest bag item first (same order as `entries`). */
  canisters: IBagCanisterSummary[];
}

/**
 * Round 2 (R2-3, BAG-2, B7): a pure summary over `listBag`'s own result —
 * no extra query, since every number it reports is already on `entries`.
 * Kept separate from `listBag` itself so existing callers (`BagList`,
 * `RollForm`, the `listBag` Server Action) that only need the entries
 * keep their return shape unchanged; a caller that also wants the summary
 * calls both.
 */
export function summarizeBag(entries: TBagEntry[]): IBagSummary {
  const stockEntries = entries.filter((entry) => entry.kind === "stock");

  const unloadedRolls = stockEntries.reduce((sum, entry) => sum + (entry.qty ?? 0), 0);
  const canisters: IBagCanisterSummary[] = stockEntries
    .filter((entry) => entry.qty !== null && entry.qty !== undefined && entry.qty > 0)
    .map((entry) => ({
      stockId: entry.stock.id,
      canisterColor: entry.stock.canisterColor,
      iso: entry.stock.iso,
      qty: entry.qty ?? 0,
    }));

  return {
    unloadedRolls,
    filmTypeCount: stockEntries.length,
    cameraCount: entries.filter((entry) => entry.kind === "camera").length,
    lensCount: entries.filter((entry) => entry.kind === "lens").length,
    canisters,
  };
}

export interface IProfileCameraSummary {
  bagItemId: string;
  brand: string;
  model: string;
  rollsShot: number;
}

export interface IProfileStockSummary {
  stockId: string;
  brand: string;
  name: string;
  canisterColor: string | null;
}

export interface IProfileSummary {
  rollCount: number;
  cameras: IProfileCameraSummary[];
  stocks: IProfileStockSummary[];
  /** `user.created_at` — `null` if `userId` doesn't resolve to a live user row (shouldn't happen for a signed-in caller). */
  joinedAt: Date | null;
}

/**
 * PR1/PR4 (Round 2): Profile's stat tile (roll count), "Túi của tôi"
 * preview (cameras with `rollsShot`, film stocks) and join date, all
 * owner-scoped. Reuses `listBag` for the bag preview rather than
 * duplicating its owner/soft-delete filtering.
 */
export async function getProfileSummary<TQueryResult extends PgQueryResultHKT>(
  db: TDb<TQueryResult>,
  userId: string,
): Promise<IProfileSummary> {
  const [entries, rollCountRows, userRows] = await Promise.all([
    listBag(db, userId),
    db.select({ value: count() }).from(roll).where(and(eq(roll.userId, userId), isNull(roll.deletedAt))),
    db.select({ createdAt: user.createdAt }).from(user).where(eq(user.id, userId)).limit(1),
  ]);

  const cameras: IProfileCameraSummary[] = entries
    .filter((entry) => entry.kind === "camera")
    .map((entry) => ({
      bagItemId: entry.bagItemId,
      brand: entry.camera.brand,
      model: entry.camera.model,
      rollsShot: entry.rollsShot ?? 0,
    }));

  const stocks: IProfileStockSummary[] = entries
    .filter((entry) => entry.kind === "stock")
    .map((entry) => ({
      stockId: entry.stock.id,
      brand: entry.stock.brand,
      name: entry.stock.name,
      canisterColor: entry.stock.canisterColor,
    }));

  return {
    rollCount: rollCountRows[0]?.value ?? 0,
    cameras,
    stocks,
    joinedAt: userRows[0]?.createdAt ?? null,
  };
}
