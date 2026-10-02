import "server-only";

import { and, asc, count, eq, inArray, isNull } from "drizzle-orm";
import type { PgQueryResultHKT } from "drizzle-orm/pg-core";
import { frame, mistake, note, roll } from "@/db/schema";
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
 * SCAN-2 "can be reordered", as "Đổi vị trí" in FrameView. `toPosition` is a place (1..N) among
 * the roll's ready, live frames, the list the user sees. The roll row is locked and those frames
 * are renumbered 1..N in the new order, so gaps from deletes or pending uploads can't skew the
 * move and two tabs can't interleave (review #3). Past the end = last.
 */
export async function moveFrameCore<TQueryResult extends PgQueryResultHKT>(
  db: TDb<TQueryResult>,
  userId: string,
  input: { frameId: string; toPosition: number },
): Promise<TFrameResult> {
  const row = await ownedFrame(db, userId, input.frameId);
  if (!row || row.status !== "ready") return { ok: false, error: "not_found" };

  await db.transaction(async (tx) => {
    await tx.select({ id: roll.id }).from(roll).where(eq(roll.id, row.rollId)).for("update");
    const ordered = await tx
      .select({ id: frame.id, position: frame.position })
      .from(frame)
      .where(and(eq(frame.rollId, row.rollId), eq(frame.status, "ready"), isNull(frame.deletedAt)))
      .orderBy(asc(frame.position), asc(frame.createdAt));

    const ids = ordered.map((f) => f.id).filter((id) => id !== row.id);
    const to = Math.min(Math.max(1, Math.trunc(input.toPosition)), ids.length + 1);
    ids.splice(to - 1, 0, row.id);

    const current = new Map(ordered.map((f) => [f.id, f.position]));
    for (const [i, id] of ids.entries()) {
      if (current.get(id) !== i + 1) {
        await tx.update(frame).set({ position: i + 1, updatedAt: new Date() }).where(eq(frame.id, id));
      }
    }
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
  return toRollFrames(db, rows, opts.publicUrl);
}

/** Ready frame rows → IRollFrame, with D5's oops and a note count. Shared by the roll page and the library grid. */
export async function toRollFrames<TQueryResult extends PgQueryResultHKT>(
  db: TDb<TQueryResult>,
  rows: (typeof frame.$inferSelect)[],
  publicUrl: string,
): Promise<IRollFrame[]> {
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
  const base = publicUrl.replace(/\/+$/, "");

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
