import "server-only";

import { and, eq, inArray, isNull, sql } from "drizzle-orm";
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

/** Most frames one bulk action may touch. */
export const MAX_BULK_FRAMES = 500;

/** The caller's live, ready frames among `frameIds` on `rollId` (deduped); null unless every id matched. */
export async function ownedReadyFrames<TQueryResult extends PgQueryResultHKT>(
  db: TDb<TQueryResult>,
  userId: string,
  rollId: string,
  frameIds: string[],
): Promise<string[] | null> {
  const unique = [...new Set(frameIds)];
  if (unique.length === 0 || unique.length > MAX_BULK_FRAMES) return null;
  if (!(await ownsRoll(db, userId, rollId))) return null;
  const rows = await db
    .select({ id: frame.id })
    .from(frame)
    .where(
      and(
        inArray(frame.id, unique),
        eq(frame.rollId, rollId),
        eq(frame.userId, userId),
        eq(frame.status, "ready"),
        isNull(frame.deletedAt),
      ),
    );
  return rows.length === unique.length ? unique : null;
}
