import "server-only";

import { and, asc, count, desc, eq, exists, inArray, isNull, lt, or, sql } from "drizzle-orm";
import type { PgQueryResultHKT } from "drizzle-orm/pg-core";
import { z } from "zod";
import { frame, mistake, roll } from "@/db/schema";
import { toRollFrames, type IRollFrame } from "@/features/frames/core";
import { hydrateRolls, type IRollEntry } from "@/features/rolls/core";
import type { TDb } from "@/features/shared/db";

/** COL-3: what `listLibraryAction` accepts; an unknown filter still reads as "all" (`parseFilter`). */
export const listLibraryInputSchema = z.object({ filter: z.string(), cursor: z.string().nullish() });

/** D7 / D17: what the view-switch action accepts; an unknown surface or view still falls back as before. */
export const viewSwitchInputSchema = z.object({ surface: z.string(), view: z.string() });

export type TLibraryFilter = "all" | "keeper" | "oops";
export interface ILibraryGroup {
  roll: IRollEntry;
  frames: IRollFrame[];
}
export interface ILibraryTotals {
  rolls: number;
  frames: number;
  keepers: number;
}
export interface ILibraryPage {
  totals: ILibraryTotals;
  counts: Record<TLibraryFilter, number>;
  groups: ILibraryGroup[];
  nextCursor: string | null;
}

const DEFAULT_PAGE = 6;

function parseCursor(cursor: string | null | undefined): { createdAt: Date; id: string } | null {
  if (!cursor) return null;
  const [iso, id] = cursor.split("|");
  const createdAt = new Date(iso ?? "");
  return id && !Number.isNaN(createdAt.getTime()) ? { createdAt, id } : null;
}

function libraryScope<TQueryResult extends PgQueryResultHKT>(db: TDb<TQueryResult>, userId: string) {
  const liveRoll = and(eq(roll.userId, userId), isNull(roll.deletedAt));
  const readyFrame = and(eq(frame.userId, userId), eq(frame.status, "ready"), isNull(frame.deletedAt));
  const hasMistake = exists(
    db
      .select({ one: sql`1` })
      .from(mistake)
      .where(and(eq(mistake.frameId, frame.id), isNull(mistake.deletedAt))),
  );
  const liveRollIds = db.select({ id: roll.id }).from(roll).where(liveRoll);
  return { liveRoll, readyFrame, hasMistake, liveRollIds };
}

/**
 * Ruling R8: Home's count line ("3 CUỘN · 108 TẤM · 16 TẤM ƯNG") over the
 * whole library, live rolls only — two counts, no page of frames. The
 * shelf view calls this alone; `listLibraryCore` reuses it.
 */
export async function libraryTotalsCore<TQueryResult extends PgQueryResultHKT>(db: TDb<TQueryResult>, userId: string): Promise<ILibraryTotals> {
  const { liveRoll, readyFrame, liveRollIds } = libraryScope(db, userId);
  const [[rollTotal], [frameTotals]] = await Promise.all([
    db.select({ n: count() }).from(roll).where(liveRoll),
    db
      .select({ all: count(), keepers: sql<number>`count(*) filter (where ${frame.isKeeper})` })
      .from(frame)
      .where(and(readyFrame, inArray(frame.rollId, liveRollIds))),
  ]);
  return { rolls: Number(rollTotal.n), frames: Number(frameTotals.all), keepers: Number(frameTotals.keepers) };
}

/** COL-3, plan D9: one page of roll groups, newest roll first, plus library-wide counts. */
export async function listLibraryCore<TQueryResult extends PgQueryResultHKT>(
  db: TDb<TQueryResult>,
  userId: string,
  opts: { filter: TLibraryFilter; cursor?: string | null; pageSize?: number; publicUrl: string },
): Promise<ILibraryPage> {
  const pageSize = opts.pageSize ?? DEFAULT_PAGE;
  const { liveRoll, readyFrame, hasMistake, liveRollIds } = libraryScope(db, userId);
  const frameMatches =
    opts.filter === "keeper" ? and(readyFrame, eq(frame.isKeeper, true)) : opts.filter === "oops" ? and(readyFrame, hasMistake) : readyFrame;

  // Counts over the whole library, on live rolls only.
  const [totals, [oopsTotal]] = await Promise.all([
    libraryTotalsCore(db, userId),
    db
      .select({ n: count() })
      .from(frame)
      .where(and(readyFrame, hasMistake, inArray(frame.rollId, liveRollIds))),
  ]);

  // One page of rolls that have at least one matching frame.
  const after = parseCursor(opts.cursor);
  const rollsWithMatch = db.select({ id: frame.rollId }).from(frame).where(frameMatches);
  const rollRows = await db
    .select()
    .from(roll)
    .where(
      and(
        liveRoll,
        inArray(roll.id, rollsWithMatch),
        after ? or(lt(roll.createdAt, after.createdAt), and(eq(roll.createdAt, after.createdAt), lt(roll.id, after.id))) : undefined,
      ),
    )
    .orderBy(desc(roll.createdAt), desc(roll.id))
    .limit(pageSize + 1);

  const pageRows = rollRows.slice(0, pageSize);
  const last = pageRows.at(-1);
  const nextCursor = rollRows.length > pageSize && last ? `${last.createdAt.toISOString()}|${last.id}` : null;

  const frameRows =
    pageRows.length === 0
      ? []
      : await db
          .select()
          .from(frame)
          .where(and(frameMatches, inArray(frame.rollId, pageRows.map((r) => r.id))))
          .orderBy(asc(frame.rollId), asc(frame.position));
  const [entries, frames] = await Promise.all([
    hydrateRolls(db, pageRows, { publicUrl: opts.publicUrl }),
    toRollFrames(db, frameRows, opts.publicUrl),
  ]);

  const rollIdByFrame = new Map(frameRows.map((f) => [f.id, f.rollId]));
  const groups = entries.map((entry) => ({
    roll: entry,
    frames: frames.filter((f) => rollIdByFrame.get(f.id) === entry.id),
  }));

  return {
    totals,
    counts: { all: totals.frames, keeper: totals.keepers, oops: Number(oopsTotal.n) },
    groups,
    nextCursor,
  };
}
