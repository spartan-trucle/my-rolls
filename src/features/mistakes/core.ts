import "server-only";

import { and, eq, inArray, isNull } from "drizzle-orm";
import type { PgQueryResultHKT } from "drizzle-orm/pg-core";
import { z } from "zod";
import { MISTAKE_TYPES, mistake, type TMistakeType } from "@/db/schema";
import type { TDb } from "@/features/shared/db";
import { bumpRollVersion, ownedFrame, ownedReadyFrames, ownsRoll } from "@/features/shared/roll-access";

const itemsSchema = z
  .array(z.object({ type: z.enum(MISTAKE_TYPES), note: z.string().max(500).optional() }))
  .max(MISTAKE_TYPES.length)
  .refine((items) => new Set(items.map((i) => i.type)).size === items.length);

export type TSetMistakesResult = { ok: true } | { ok: false; error: "not_found" | "invalid_input" };

/**
 * NOTE-2, Phase 2 plan D4, D5: `MistakePicker` sends the whole set for one frame, or for the
 * roll when `frameId` is null. Types that stay keep their row (and id), dropped types are
 * soft-deleted, new ones inserted. Bumps `roll.version` once (D19).
 */
export async function setMistakesCore<TQueryResult extends PgQueryResultHKT>(
  db: TDb<TQueryResult>,
  userId: string,
  input: { rollId: string; frameId: string | null; items: Array<{ type: TMistakeType; note?: string }> },
): Promise<TSetMistakesResult> {
  const parsed = itemsSchema.safeParse(input.items);
  if (!parsed.success) return { ok: false, error: "invalid_input" };
  if (!(await ownsRoll(db, userId, input.rollId))) return { ok: false, error: "not_found" };
  if (input.frameId && !(await ownedFrame(db, userId, input.frameId, { rollId: input.rollId }))) {
    return { ok: false, error: "not_found" };
  }

  const scope = and(
    eq(mistake.rollId, input.rollId),
    eq(mistake.userId, userId),
    input.frameId ? eq(mistake.frameId, input.frameId) : isNull(mistake.frameId),
    isNull(mistake.deletedAt),
  );

  await db.transaction(async (tx) => {
    const current = await tx.select().from(mistake).where(scope);
    const wanted = new Map(parsed.data.map((i) => [i.type, i.note?.trim() || null]));
    const now = new Date();

    const dropped = current.filter((m) => !wanted.has(m.type)).map((m) => m.id);
    if (dropped.length > 0) {
      await tx.update(mistake).set({ deletedAt: now, updatedAt: now }).where(inArray(mistake.id, dropped));
    }
    for (const m of current) {
      if (wanted.has(m.type) && wanted.get(m.type) !== m.note) {
        await tx.update(mistake).set({ note: wanted.get(m.type), updatedAt: now }).where(eq(mistake.id, m.id));
      }
    }
    const have = new Set(current.map((m) => m.type));
    const added = parsed.data.filter((i) => !have.has(i.type));
    if (added.length > 0) {
      await tx.insert(mistake).values(
        added.map((i) => ({
          userId,
          rollId: input.rollId,
          frameId: input.frameId,
          type: i.type,
          note: wanted.get(i.type) ?? null,
        })),
      );
    }
  });

  await bumpRollVersion(db, input.rollId);
  return { ok: true };
}

/** COL-4 bulk oops, plan D13: add the picked types to every frame; existing mistakes stay; one version bump. */
export async function addMistakesToFramesCore<TQueryResult extends PgQueryResultHKT>(
  db: TDb<TQueryResult>,
  userId: string,
  input: { rollId: string; frameIds: string[]; items: Array<{ type: TMistakeType; note?: string }> },
): Promise<TSetMistakesResult> {
  const parsed = itemsSchema.safeParse(input.items);
  if (!parsed.success || parsed.data.length === 0) return { ok: false, error: "invalid_input" };
  const ids = await ownedReadyFrames(db, userId, input.rollId, input.frameIds);
  if (!ids) return { ok: false, error: "not_found" };

  await db.transaction(async (tx) => {
    const existing = await tx
      .select({ frameId: mistake.frameId, type: mistake.type })
      .from(mistake)
      .where(and(inArray(mistake.frameId, ids), isNull(mistake.deletedAt)));
    const have = new Set(existing.map((m) => `${m.frameId}|${m.type}`));
    const rows = ids.flatMap((frameId) =>
      parsed.data
        .filter((i) => !have.has(`${frameId}|${i.type}`))
        .map((i) => ({ userId, rollId: input.rollId, frameId, type: i.type, note: i.note?.trim() || null })),
    );
    if (rows.length > 0) await tx.insert(mistake).values(rows);
  });
  await bumpRollVersion(db, input.rollId);
  return { ok: true };
}

export interface IRollMistake {
  id: string;
  frameId: string | null;
  type: TMistakeType;
  note: string | null;
}

/** The roll's live mistakes (roll-level and per frame), for the roll header and the picker. */
export async function listRollMistakesCore<TQueryResult extends PgQueryResultHKT>(
  db: TDb<TQueryResult>,
  userId: string,
  rollId: string,
): Promise<IRollMistake[]> {
  if (!(await ownsRoll(db, userId, rollId))) return [];
  return db
    .select({ id: mistake.id, frameId: mistake.frameId, type: mistake.type, note: mistake.note })
    .from(mistake)
    .where(and(eq(mistake.rollId, rollId), eq(mistake.userId, userId), isNull(mistake.deletedAt)))
    .orderBy(mistake.createdAt);
}
