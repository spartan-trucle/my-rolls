import "server-only";

import { timingSafeEqual } from "node:crypto";
import { and, asc, eq, inArray, isNull, lt } from "drizzle-orm";
import type { PgQueryResultHKT } from "drizzle-orm/pg-core";
import { frame } from "@/db/schema";
import type { TDb } from "@/features/shared/db";
import type { TR2Bucket } from "@/lib/r2";

const STALE_AFTER_MS = 24 * 60 * 60 * 1000;
const MAX_PER_RUN = 500;

export type TDeleteObjects = (input: { bucket: TR2Bucket; keys: string[] }) => Promise<void>;

/**
 * Phase 2 plan D17 (SCAN-3 cleanup): frames still `pending` 24 h after their slot was signed
 * never finished uploading. Their R2 objects go first and the rows second, so a failed R2 call
 * leaves the rows for the next night's run instead of rows pointing at deleted objects. Hard
 * delete: the user never saw these frames.
 */
export async function cleanupPendingFramesCore<TQueryResult extends PgQueryResultHKT>(
  db: TDb<TQueryResult>,
  deps: { now: Date; deleteObjects: TDeleteObjects },
): Promise<{ deleted: number }> {
  const stale = await db
    .select({ id: frame.id, originalKey: frame.originalKey, gridKey: frame.gridKey, viewKey: frame.viewKey })
    .from(frame)
    .where(
      and(
        eq(frame.status, "pending"),
        isNull(frame.deletedAt),
        lt(frame.createdAt, new Date(deps.now.getTime() - STALE_AFTER_MS)),
      ),
    )
    .orderBy(asc(frame.createdAt))
    .limit(MAX_PER_RUN);

  if (stale.length === 0) return { deleted: 0 };

  await deps.deleteObjects({ bucket: "originals", keys: stale.map((f) => f.originalKey) });
  await deps.deleteObjects({ bucket: "public", keys: stale.flatMap((f) => [f.gridKey, f.viewKey]) });
  // Review #8: only rows still pending. Confirm refuses frames older than 23 h, so this is a
  // second guard for a row confirmed while the objects were being deleted.
  await db.delete(frame).where(and(inArray(frame.id, stale.map((f) => f.id)), eq(frame.status, "pending")));

  return { deleted: stale.length };
}

/** Vercel Cron sends `Authorization: Bearer $CRON_SECRET`. With no secret set, nothing is authorized. */
export function isCronAuthorized(header: string | null, secret: string | undefined): boolean {
  if (!secret || !header) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const given = Buffer.from(header);
  return given.length === expected.length && timingSafeEqual(given, expected);
}
