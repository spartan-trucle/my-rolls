import "server-only";

import { and, eq, isNull, or } from "drizzle-orm";
import type { PgQueryResultHKT } from "drizzle-orm/pg-core";
import { bagItem, camera, lens, stock } from "@/db/schema";
import type { TDb } from "@/features/shared/db";

export interface IAddToBagInput {
  kind: "camera" | "lens" | "stock";
  refId: string;
}

export type TAddToBagErrorCode = "unauthenticated" | "not_found" | "duplicate";
export type TAddToBagResult =
  | { ok: true; bagItemId: string }
  | { ok: false; error: TAddToBagErrorCode };

export interface IRemoveFromBagInput {
  bagItemId: string;
}

export type TRemoveFromBagErrorCode = "unauthenticated" | "not_found";
export type TRemoveFromBagResult = { ok: true } | { ok: false; error: TRemoveFromBagErrorCode };

/**
 * Whether `refId` is a row the caller is allowed to point a bag item at
 * (BAG-1): seeded (`owner_id IS NULL`) or the caller's own, and not
 * soft-deleted. `lens` has no seeded rows (D3), so a lens ref must be the
 * caller's own.
 */
async function refIsUsable<TQueryResult extends PgQueryResultHKT>(
  db: TDb<TQueryResult>,
  kind: IAddToBagInput["kind"],
  refId: string,
  userId: string,
): Promise<boolean> {
  if (kind === "stock") {
    const rows = await db
      .select({ id: stock.id })
      .from(stock)
      .where(
        and(
          eq(stock.id, refId),
          isNull(stock.deletedAt),
          or(isNull(stock.ownerId), eq(stock.ownerId, userId)),
        ),
      )
      .limit(1);
    return rows[0] !== undefined;
  }

  if (kind === "camera") {
    const rows = await db
      .select({ id: camera.id })
      .from(camera)
      .where(
        and(
          eq(camera.id, refId),
          isNull(camera.deletedAt),
          or(isNull(camera.ownerId), eq(camera.ownerId, userId)),
        ),
      )
      .limit(1);
    return rows[0] !== undefined;
  }

  const rows = await db
    .select({ id: lens.id })
    .from(lens)
    .where(and(eq(lens.id, refId), eq(lens.ownerId, userId), isNull(lens.deletedAt)))
    .limit(1);
  return rows[0] !== undefined;
}

/**
 * BAG-1: adds `refId` to `userId`'s bag once — the ref must be seeded or
 * the caller's own (never another user's private entry), and there must
 * be no other live bag item already pointing at the same `kind` + `refId`
 * (no duplicates).
 *
 * `import "server-only"` (top of file) keeps this — and its DB imports —
 * out of the client bundle even though `actions.ts` re-exports thin
 * wrappers around it for client components to call.
 */
export async function addToBagCore<TQueryResult extends PgQueryResultHKT>(
  db: TDb<TQueryResult>,
  userId: string,
  input: IAddToBagInput,
): Promise<TAddToBagResult> {
  if (!(await refIsUsable(db, input.kind, input.refId, userId))) {
    return { ok: false, error: "not_found" };
  }

  const existing = await db
    .select({ id: bagItem.id })
    .from(bagItem)
    .where(
      and(
        eq(bagItem.userId, userId),
        eq(bagItem.kind, input.kind),
        eq(bagItem.refId, input.refId),
        isNull(bagItem.deletedAt),
      ),
    )
    .limit(1);

  if (existing[0]) return { ok: false, error: "duplicate" };

  const [row] = await db
    .insert(bagItem)
    .values({ userId, kind: input.kind, refId: input.refId })
    .returning();

  return { ok: true, bagItemId: row.id };
}

/**
 * BAG-1: soft-deletes one of `userId`'s own bag items — never another
 * user's, and never a hard delete (D9: `bag_item.deleted_at`).
 */
export async function removeFromBagCore<TQueryResult extends PgQueryResultHKT>(
  db: TDb<TQueryResult>,
  userId: string,
  input: IRemoveFromBagInput,
): Promise<TRemoveFromBagResult> {
  const [row] = await db
    .update(bagItem)
    .set({ deletedAt: new Date() })
    .where(and(eq(bagItem.id, input.bagItemId), eq(bagItem.userId, userId), isNull(bagItem.deletedAt)))
    .returning();

  if (!row) return { ok: false, error: "not_found" };

  return { ok: true };
}
