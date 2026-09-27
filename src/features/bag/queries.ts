import { and, desc, eq, inArray, isNull, or } from "drizzle-orm";
import type { PgQueryResultHKT } from "drizzle-orm/pg-core";
import { bagItem, camera, lens, stock } from "@/db/schema";
import type { TDb } from "@/features/shared/db";

export type TStockRow = typeof stock.$inferSelect;
export type TCameraRow = typeof camera.$inferSelect;
export type TLensRow = typeof lens.$inferSelect;

export type TBagEntry =
  | { bagItemId: string; kind: "stock"; createdAt: Date; stock: TStockRow }
  | {
      bagItemId: string;
      kind: "camera";
      createdAt: Date;
      camera: TCameraRow;
      // D20: a single-use camera's fixed film, resolved for display —
      // `null` for every other camera.
      fixedStock: TStockRow | null;
    }
  | { bagItemId: string; kind: "lens"; createdAt: Date; lens: TLensRow };

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

  const stockById = new Map(stockRows.map((row) => [row.id, row]));
  const cameraById = new Map(cameraRows.map((row) => [row.id, row]));
  const lensById = new Map(lensRows.map((row) => [row.id, row]));

  const entries: TBagEntry[] = [];

  for (const item of items) {
    if (item.kind === "stock") {
      const stockRow = stockById.get(item.refId);
      if (ownedAndLive(stockRow, userId)) {
        entries.push({ bagItemId: item.id, kind: "stock", createdAt: item.createdAt, stock: stockRow });
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
        });
      }
    } else {
      const lensRow = lensById.get(item.refId);
      if (lensRow !== undefined && lensRow.deletedAt === null && lensRow.ownerId === userId) {
        entries.push({ bagItemId: item.id, kind: "lens", createdAt: item.createdAt, lens: lensRow });
      }
    }
  }

  return entries;
}
