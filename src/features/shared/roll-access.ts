import "server-only";

import { and, eq, isNull, sql } from "drizzle-orm";
import type { PgQueryResultHKT } from "drizzle-orm/pg-core";
import { frame, roll } from "@/db/schema";
import type { TDb } from "./db";

/** True when `rollId` is a live roll of `userId` (no foreign keys, so every write checks, Phase 1 D9). */
export async function ownsRoll<TQueryResult extends PgQueryResultHKT>(
  db: TDb<TQueryResult>,
  userId: string,
  rollId: string,
): Promise<boolean> {
  const [row] = await db
    .select({ id: roll.id })
    .from(roll)
    .where(and(eq(roll.id, rollId), eq(roll.userId, userId), isNull(roll.deletedAt)))
    .limit(1);
  return Boolean(row);
}

/** The caller's live frame, optionally required to belong to `rollId`. */
export async function ownedFrame<TQueryResult extends PgQueryResultHKT>(
  db: TDb<TQueryResult>,
  userId: string,
  frameId: string,
  opts: { rollId?: string; includeDeleted?: boolean } = {},
) {
  const [row] = await db
    .select()
    .from(frame)
    .where(
      and(
        eq(frame.id, frameId),
        eq(frame.userId, userId),
        opts.includeDeleted ? undefined : isNull(frame.deletedAt),
        opts.rollId ? eq(frame.rollId, opts.rollId) : undefined,
      ),
    )
    .limit(1);
  return row ?? null;
}

/** Phase 2 plan D19: marks, mistakes and memory bump `roll.version`, so share images re-render. */
export async function bumpRollVersion<TQueryResult extends PgQueryResultHKT>(db: TDb<TQueryResult>, rollId: string) {
  await db
    .update(roll)
    .set({ version: sql`${roll.version} + 1`, updatedAt: new Date() })
    .where(eq(roll.id, rollId));
}
