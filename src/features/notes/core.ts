import "server-only";

import { and, desc, eq, isNull } from "drizzle-orm";
import type { PgQueryResultHKT } from "drizzle-orm/pg-core";
import { frame, note, roll } from "@/db/schema";
import type { TDb } from "@/features/shared/db";
import { bumpRollVersion, ownedFrame, ownsRoll } from "@/features/shared/roll-access";

const MAX_NOTE = 2_000;
const MAX_MEMORY = 10_000;

export type TSaveNoteResult =
  | { ok: true; id: string; updatedAt: Date; deleted: boolean }
  | { ok: false; error: "not_found" | "too_long" };

/**
 * NOTE-1, Phase 2 plan D6, D20: creates or edits a note on the roll or one of its frames.
 * Autosave sends every change here; an empty body soft-deletes the note. Notes don't bump
 * `roll.version` (D19): they aren't on share images.
 */
export async function saveNoteCore<TQueryResult extends PgQueryResultHKT>(
  db: TDb<TQueryResult>,
  userId: string,
  input: { noteId?: string; rollId: string; frameId?: string | null; body: string },
): Promise<TSaveNoteResult> {
  if (input.body.length > MAX_NOTE) return { ok: false, error: "too_long" };
  if (!(await ownsRoll(db, userId, input.rollId))) return { ok: false, error: "not_found" };
  if (input.frameId && !(await ownedFrame(db, userId, input.frameId, { rollId: input.rollId }))) {
    return { ok: false, error: "not_found" };
  }

  const body = input.body.trim();
  const now = new Date();

  if (input.noteId) {
    const [existing] = await db
      .select({ id: note.id })
      .from(note)
      .where(and(eq(note.id, input.noteId), eq(note.userId, userId), eq(note.rollId, input.rollId), isNull(note.deletedAt)))
      .limit(1);
    if (!existing) return { ok: false, error: "not_found" };
    await db
      .update(note)
      .set(body ? { body, updatedAt: now } : { deletedAt: now, updatedAt: now })
      .where(eq(note.id, existing.id));
    return { ok: true, id: existing.id, updatedAt: now, deleted: !body };
  }

  if (!body) return { ok: false, error: "not_found" };
  const [created] = await db
    .insert(note)
    .values({ userId, rollId: input.rollId, frameId: input.frameId ?? null, body })
    .returning({ id: note.id, updatedAt: note.updatedAt });
  return { ok: true, id: created.id, updatedAt: created.updatedAt, deleted: false };
}

export async function deleteNoteCore<TQueryResult extends PgQueryResultHKT>(
  db: TDb<TQueryResult>,
  userId: string,
  input: { noteId: string },
): Promise<{ ok: true } | { ok: false; error: "not_found" }> {
  const [row] = await db
    .update(note)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(note.id, input.noteId), eq(note.userId, userId), isNull(note.deletedAt)))
    .returning({ id: note.id });
  return row ? { ok: true } : { ok: false, error: "not_found" };
}

/** NOTE-1: the roll's one longer memory, autosaved. It's on share views, so it bumps the version. */
export async function saveMemoryCore<TQueryResult extends PgQueryResultHKT>(
  db: TDb<TQueryResult>,
  userId: string,
  input: { rollId: string; memory: string },
): Promise<{ ok: true; updatedAt: Date } | { ok: false; error: "not_found" | "too_long" }> {
  if (input.memory.length > MAX_MEMORY) return { ok: false, error: "too_long" };
  if (!(await ownsRoll(db, userId, input.rollId))) return { ok: false, error: "not_found" };
  const memory = input.memory.trim() || null;
  const now = new Date();
  await db.update(roll).set({ memory, updatedAt: now }).where(eq(roll.id, input.rollId));
  await bumpRollVersion(db, input.rollId);
  return { ok: true, updatedAt: now };
}

export interface IRollNote {
  id: string;
  body: string;
  frameId: string | null;
  framePosition: number | null;
  createdAt: Date;
  updatedAt: Date;
}

/** The roll's live notes, newest first; a frame note carries its frame's position for the link. */
export async function listRollNotesCore<TQueryResult extends PgQueryResultHKT>(
  db: TDb<TQueryResult>,
  userId: string,
  rollId: string,
): Promise<IRollNote[]> {
  if (!(await ownsRoll(db, userId, rollId))) return [];
  const rows = await db
    .select({
      id: note.id,
      body: note.body,
      frameId: note.frameId,
      framePosition: frame.position,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    })
    .from(note)
    .leftJoin(frame, and(eq(frame.id, note.frameId), isNull(frame.deletedAt)))
    .where(and(eq(note.rollId, rollId), eq(note.userId, userId), isNull(note.deletedAt)))
    .orderBy(desc(note.createdAt));
  return rows.map((r) => ({ ...r, framePosition: r.frameId ? r.framePosition : null }));
}
