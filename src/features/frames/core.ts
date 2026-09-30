import "server-only";

import { and, asc, count, eq, gt, gte, inArray, isNull, lt, lte, sql } from "drizzle-orm";
import type { PgQueryResultHKT } from "drizzle-orm/pg-core";
import { frame, mistake, note } from "@/db/schema";
import type { TDb } from "@/features/shared/db";
import { bumpRollVersion, ownedFrame, ownsRoll } from "@/features/shared/roll-access";

export type TFrameResult = { ok: true } | { ok: false; error: "not_found" };

/**
 * SCAN-4, Phase 2 plan D3: a blank frame can't be tấm ưng, so setting one clears the other.
 * When both come in the same call, blank wins.
 */
export async function setFrameMarksCore<TQueryResult extends PgQueryResultHKT>(
  db: TDb<TQueryResult>,
  userId: string,
  input: { frameId: string; isKeeper?: boolean; isBlank?: boolean },
): Promise<TFrameResult> {
  const row = await ownedFrame(db, userId, input.frameId);
  if (!row) return { ok: false, error: "not_found" };

  let isKeeper = input.isKeeper ?? row.isKeeper;
  let isBlank = input.isBlank ?? row.isBlank;
  if (input.isBlank === true) isKeeper = false;
  else if (input.isKeeper === true) isBlank = false;

  await db.update(frame).set({ isKeeper, isBlank, updatedAt: new Date() }).where(eq(frame.id, row.id));
  await bumpRollVersion(db, row.rollId);
  return { ok: true };
}

/**
 * SCAN-2 "can be reordered", as "Đổi vị trí" in FrameView: moves one frame and shifts the
 * frames between its old and new position by one, in one transaction. Past the end = last.
 */
export async function moveFrameCore<TQueryResult extends PgQueryResultHKT>(
  db: TDb<TQueryResult>,
  userId: string,
  input: { frameId: string; toPosition: number },
): Promise<TFrameResult> {
  const row = await ownedFrame(db, userId, input.frameId);
  if (!row) return { ok: false, error: "not_found" };

  await db.transaction(async (tx) => {
    const [{ value: total }] = await tx
      .select({ value: count() })
      .from(frame)
      .where(and(eq(frame.rollId, row.rollId), isNull(frame.deletedAt)));
    const to = Math.min(Math.max(1, Math.trunc(input.toPosition)), total);
    const from = row.position;
    if (to === from) return;

    const live = and(eq(frame.rollId, row.rollId), isNull(frame.deletedAt));
    if (to < from) {
      await tx
        .update(frame)
        .set({ position: sql`${frame.position} + 1` })
        .where(and(live, gte(frame.position, to), lt(frame.position, from)));
    } else {
      await tx
        .update(frame)
        .set({ position: sql`${frame.position} - 1` })
        .where(and(live, gt(frame.position, from), lte(frame.position, to)));
    }
    await tx.update(frame).set({ position: to, updatedAt: new Date() }).where(eq(frame.id, row.id));
  });
  await bumpRollVersion(db, row.rollId);
  return { ok: true };
}

/** Phase 2 plan D23: soft delete, undone by `restoreFrameCore`. R2 objects stay. */
export async function deleteFrameCore<TQueryResult extends PgQueryResultHKT>(
  db: TDb<TQueryResult>,
  userId: string,
  input: { frameId: string },
): Promise<TFrameResult> {
  const row = await ownedFrame(db, userId, input.frameId);
  if (!row) return { ok: false, error: "not_found" };
  await db.update(frame).set({ deletedAt: new Date(), updatedAt: new Date() }).where(eq(frame.id, row.id));
  await bumpRollVersion(db, row.rollId);
  return { ok: true };
}

export async function restoreFrameCore<TQueryResult extends PgQueryResultHKT>(
  db: TDb<TQueryResult>,
  userId: string,
  input: { frameId: string },
): Promise<TFrameResult> {
  const row = await ownedFrame(db, userId, input.frameId, { includeDeleted: true });
  if (!row) return { ok: false, error: "not_found" };
  await db.update(frame).set({ deletedAt: null, updatedAt: new Date() }).where(eq(frame.id, row.id));
  await bumpRollVersion(db, row.rollId);
  return { ok: true };
}

export interface IRollFrame {
  id: string;
  position: number;
  gridUrl: string;
  viewUrl: string;
  width: number | null;
  height: number | null;
  isKeeper: boolean;
  isBlank: boolean;
  isOops: boolean;
  noteCount: number;
}

/** The roll page's grid: ready, live frames by position, with D5's oops and a note count. */
export async function listRollFramesCore<TQueryResult extends PgQueryResultHKT>(
  db: TDb<TQueryResult>,
  userId: string,
  rollId: string,
  opts: { publicUrl: string },
): Promise<IRollFrame[]> {
  if (!(await ownsRoll(db, userId, rollId))) return [];

  const rows = await db
    .select()
    .from(frame)
    .where(and(eq(frame.rollId, rollId), eq(frame.userId, userId), eq(frame.status, "ready"), isNull(frame.deletedAt)))
    .orderBy(asc(frame.position));
  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.id);
  const oops = await db
    .selectDistinct({ frameId: mistake.frameId })
    .from(mistake)
    .where(and(inArray(mistake.frameId, ids), isNull(mistake.deletedAt)));
  const notes = await db
    .select({ frameId: note.frameId, value: count() })
    .from(note)
    .where(and(inArray(note.frameId, ids), isNull(note.deletedAt)))
    .groupBy(note.frameId);

  const oopsIds = new Set(oops.map((o) => o.frameId));
  const noteCounts = new Map(notes.map((n) => [n.frameId, Number(n.value)]));
  const base = opts.publicUrl.replace(/\/+$/, "");

  return rows.map((r) => ({
    id: r.id,
    position: r.position,
    gridUrl: `${base}/${r.gridKey}`,
    viewUrl: `${base}/${r.viewKey}`,
    width: r.width,
    height: r.height,
    isKeeper: r.isKeeper,
    isBlank: r.isBlank,
    isOops: oopsIds.has(r.id),
    noteCount: noteCounts.get(r.id) ?? 0,
  }));
}
